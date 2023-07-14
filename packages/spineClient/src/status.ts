import {Logger} from "@aws-lambda-powertools/logger"
import axios, {AxiosError} from "axios"
import {Agent} from "https"

export interface StatusCheckResponse {
  status: "pass" | "warn" | "error"
  timeout: "true" | "false"
  responseCode: number
  outcome?: string
  links?: string
}

export async function serviceHealthCheck(url: string, logger: Logger, httpsAgent: Agent): Promise<StatusCheckResponse> {
  try {
    const response = await axios.get<string>(url, {timeout: 20000, httpsAgent})
    return {
      status: response.status === 200 ? "pass" : "error",
      timeout: "false",
      responseCode: response.status,
      outcome: response.data,
      links: url
    }
  } catch (error) {
    let message
    if (error instanceof Error) message = error.message
    else message = String(error)
    logger.error("Error calling external service for status check: " + message)

    let responseCode

    const axiosError = error as AxiosError
    if (axiosError.response === undefined) {
      responseCode = 500
    } else {
      responseCode = axiosError.response.status
    }

    return {
      status: "error",
      timeout: axiosError.code === "ECONNABORTED" ? "true" : "false",
      responseCode: responseCode,
      outcome: typeof axiosError.response?.data === "string" ? axiosError.response?.data : undefined,
      links: url
    }
  }
}
