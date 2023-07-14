import {ClientRequest, SpineResponse} from "./models/spine"
import {SpineClient} from "./spine-client"
import {StatusCheckResponse} from "./status"

export class SandboxSpineClient implements SpineClient {
  async send(clientRequest: ClientRequest): Promise<SpineResponse<unknown>> {
    return await this.handleSpineRequest(clientRequest)
  }

  async getStatus(): Promise<StatusCheckResponse> {
    return {
      status: "pass",
      timeout: "false",
      responseCode: 200
    }
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
                code: "INTERACTION_NOT_SUPPORTED_BY_SANDBOX",
                display: "Interaction not supported by sandbox",
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
}
