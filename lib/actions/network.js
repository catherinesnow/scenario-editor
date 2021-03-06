import {BadRequest, RequestTimeout} from 'http-errors'
import {createAction} from 'redux-actions'

import authenticatedFetch from '../utils/authenticated-fetch'
import messages from '../messages'

const IDENTITY = (i) => i
const REQUEST_TIMEOUT_MS = 15000 // if things take more than 15s to save we have a problem

export const lockUiWithError = createAction('lock ui with error', IDENTITY, { error: true })
export const incrementOutstandingRequests = createAction('increment outstanding requests')
export const decrementOutstandingRequests = createAction('decrement outstanding requests')
export const deleteModificationFromStore = createAction('delete modification')

function fetchAction ({
  url,
  options
}) {
  return new Promise((resolve, reject) => {
    const timeoutid = setTimeout(() => {
      reject(new RequestTimeout())
    }, REQUEST_TIMEOUT_MS)
    authenticatedFetch(url, options)
      .then((res) => {
        clearTimeout(timeoutid)
        if (res.ok) {
          resolve(res)
        } else {
          reject(new BadRequest(res.statusText), res)
        }
      })
      .catch((e) => {
        clearTimeout(timeoutid)
        reject(e)
      })
  })
}

export function serverAction ({
  next = false,
  onError = false,
  options,
  url
}) {
  return [
    incrementOutstandingRequests(),
    fetchAction({url, options})
      .then((res) => {
        const actions = [decrementOutstandingRequests()]
        if (next) actions.push(next(res))
        return actions
      })
      .catch((err, res) => {
        const actions = [decrementOutstandingRequests()]
        if (onError) {
          actions.push(onError(err, res))
        } else {
          console.error(err)
          console.error(err.stack)
          actions.push(lockUiWithError({
            error: messages.network.error,
            detailMessage: err.message
          }))
        }
        return actions
      })
  ]
}
