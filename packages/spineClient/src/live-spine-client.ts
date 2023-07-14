import {ClientRequest, SpineResponse} from "./models/spine"
import {Logger} from "@aws-lambda-powertools/logger"
import {serviceHealthCheck, StatusCheckResponse} from "./status"
import {SpineClient} from "./spine-client"
import {Agent} from "https"

const SPINE_URL_SCHEME = "https"
const SPINE_ENDPOINT = process.env.TargetSpineServer

export class LiveSpineClient implements SpineClient {
  private readonly spineASID: string | undefined
  private readonly httpsAgent: Agent

  constructor() {
    this.spineASID = process.env.SpineASID

    this.httpsAgent = new Agent({
      cert: process.env.SpinePublicCertificate,
      key: process.env.SpinePrivateKey,
      ca: process.env.SpineCAChain
    })
  }

  async send(clientRequest: ClientRequest): Promise<SpineResponse<unknown>> {
    return await this.handleSpineRequest(clientRequest)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleSpineRequest(spineRequest: ClientRequest): Promise<SpineResponse<unknown>> {
    const notSupportedOperationOutcome = {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "information",
          code: "exception",
          details: {
            coding: [
              {
                code: "INTERACTION_NOT_SUPPORTED",
                display: "Interaction not supported",
                system: "https://fhir.nhs.uk/R4/CodeSystem/Spine-ErrorOrWarningCode",
                version: "1"
              }
            ]
          }
        }
      ]
    }

    return Promise.resolve({
      statusCode: 400,
      body: notSupportedOperationOutcome
    })
  }

  private getSpineEndpoint(requestPath?: string) {
    return `${SPINE_URL_SCHEME}://${SPINE_ENDPOINT}/${requestPath}`
  }

  async getStatus(logger: Logger): Promise<StatusCheckResponse> {
    const url = this.getSpineEndpoint("healthcheck")
    return serviceHealthCheck(url, logger, this.httpsAgent)
  }
}
