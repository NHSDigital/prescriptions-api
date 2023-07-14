import {APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda"
import {handler} from "../src/app"
import {expect, describe, it} from "@jest/globals"
import {ContextExamples} from "@aws-lambda-powertools/commons"

const dummyContext = ContextExamples.helloworldContext

const exampleEvent = JSON.stringify({
  httpMethod: "get",
  body: "",
  headers: {},
  isBase64Encoded: false,
  multiValueHeaders: {},
  multiValueQueryStringParameters: {},
  path: "/hello",
  pathParameters: {},
  queryStringParameters: {},
  requestContext: {
    accountId: "123456789012",
    apiId: "1234",
    authorizer: {},
    httpMethod: "get",
    identity: {
      accessKey: "",
      accountId: "",
      apiKey: "",
      apiKeyId: "",
      caller: "",
      clientCert: {
        clientCertPem: "",
        issuerDN: "",
        serialNumber: "",
        subjectDN: "",
        validity: {notAfter: "", notBefore: ""}
      },
      cognitoAuthenticationProvider: "",
      cognitoAuthenticationType: "",
      cognitoIdentityId: "",
      cognitoIdentityPoolId: "",
      principalOrgId: "",
      sourceIp: "",
      user: "",
      userAgent: "",
      userArn: ""
    },
    path: "/hello",
    protocol: "HTTP/1.1",
    requestId: "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
    requestTimeEpoch: 1428582896000,
    resourceId: "123456",
    resourcePath: "/hello",
    stage: "dev"
  },
  resource: "",
  stageVariables: {}
})

describe("Unit test for app handler", function () {
  it("verifies successful response with no params", async () => {
    const event: APIGatewayProxyEvent = JSON.parse(exampleEvent)
    const result: APIGatewayProxyResult = (await handler(event, dummyContext)) as APIGatewayProxyResult

    expect(result.statusCode).toEqual(200)
    expect(result.body).toEqual(
      JSON.stringify({
        message: "hello world from getMyPrescriptions lambda"
      })
    )
  })

  it("verifies teapot response", async () => {
    const event: APIGatewayProxyEvent = JSON.parse(exampleEvent)
    event.queryStringParameters = {
      returnType: "teapot"
    }
    const result: APIGatewayProxyResult = (await handler(event, dummyContext)) as APIGatewayProxyResult

    expect(result.statusCode).toEqual(418)
    expect(result.body).toEqual(
      JSON.stringify({
        message: "I am a teapot short and stout"
      })
    )
  })

  it("verifies error response", async () => {
    const event: APIGatewayProxyEvent = JSON.parse(exampleEvent)
    event.queryStringParameters = {
      returnType: "error"
    }
    const result: APIGatewayProxyResult = (await handler(event, dummyContext)) as APIGatewayProxyResult

    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body)).toEqual({
      id: "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "fatal",
          code: "exception",
          details: {
            coding: [
              {
                code: "SERVER_ERROR",
                display: "500: The Server has encountered an error processing the request.",
                system: "https://fhir.nhs.uk/CodeSystem/http-error-codes"
              }
            ]
          }
        }
      ]
    })
  })
})

export {}
