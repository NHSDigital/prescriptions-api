import {serviceHealthCheck} from "../src/status"
import "jest"
import * as moxios from "moxios"
import axios from "axios"
import {Agent} from "https"
import {Logger} from "@aws-lambda-powertools/logger"

describe("Health check", () => {
  const logger = new Logger({serviceName: "spineClient"})
  const httpsAgent = new Agent()

  beforeEach(() => {
    moxios.install(axios)
  })

  afterEach(() => {
    moxios.uninstall(axios)
  })

  test("Successful health check result returns success", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({
        status: 200,
        statusText: "OK",
        headers: {
          "content-location": "/_poll/test-content-location"
        }
      })
    })

    const spineResponse = await serviceHealthCheck("test_status", logger, httpsAgent)

    expect(spineResponse.status).toBe("pass")
    expect(spineResponse.responseCode).toBe(200)
    expect(spineResponse.links).toBe("test_status")
    expect(spineResponse.timeout).toBe("false")
  })

  test("Failure health check result returns failure", async () => {
    moxios.wait(() => {
      const request = moxios.requests.mostRecent()
      request.respondWith({
        status: 500,
        statusText: "NOT OK",
        headers: {
          "content-location": "/_poll/test-content-location"
        }
      })
    })

    const spineResponse = await serviceHealthCheck("test_status", logger, httpsAgent)

    expect(spineResponse.status).toBe("error")
    expect(spineResponse.responseCode).toBe(500)
    expect(spineResponse.links).toBe("test_status")
    expect(spineResponse.timeout).toBe("false")
  })
})
