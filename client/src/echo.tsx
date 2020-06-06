import { ClientReadableStream } from 'grpc-web'
import React, { useState } from 'react'
import { EchoServicePromiseClient } from './protos/echo/echo_grpc_web_pb'
import { EchoRequest, Empty, ServerStreamingEchoRequest, ServerStreamingEchoResponse } from './protos/echo/echo_pb'

const codeToString = (code: number) => {
	switch (code) {
		case 0: return "OK"
		case 1: return "Canceled"
		case 2: return "Unknown"
		case 3: return "InvalidArgument"
		case 4: return "DeadlineExceeded"
		case 5: return "NotFound"
		case 6: return "AlreadyExists"
		case 7: return "PermissionDenied"
		case 8: return "ResourceExhausted"
		case 9: return "FailedPrecondition"
		case 10: return "Aborted"
		case 11: return "OutOfRange"
		case 12: return "Unimplemented"
		case 13: return "Internal"
		case 14: return "Unavailable"
		case 15: return "DataLoss"
		case 16: return "Unauthenticated"
		default: return `Code(${code})`
	}
}

type logFunction = (...messages: string[]) => void

const logStream = (log: logFunction, prefix: string, stream: ClientReadableStream<ServerStreamingEchoResponse>) => {
	stream.on('data', response => log(prefix, " data: ", response.getMessage()))
	stream.on('status', status => {
		log(prefix, " status ", codeToString(status.code), ": '", status.details, "'")
		if (status.metadata) {
			Object.keys(status.metadata).forEach(key =>
				log(prefix, " metadata[", key, "]='", status.metadata![key])
			)
		}
	})
	stream.on('error', err => log("serverStreamingEcho error ", codeToString(err.code), ": '", err.message, "'"))
	stream.on('end', () => log(prefix, " end"))
}

const logException = (log: logFunction, prefix: string, e: any) =>
	log(prefix, " exception:\n> ", codeToString(e.code), ": ", e.message)


export const EchoClient: React.FC<{
	client: EchoServicePromiseClient
	log: (...messages: string[]) => void
}> = ({ client, log }) => {

	const [message, setMessage] = useState("hello")
	const [messageCount, setMessageCount] = useState(5)
	const [messageInterval, setMessageInterval] = useState(1000)

	const echo = async () => {
		try {
			const request = new EchoRequest()
			request.setMessage(message)

			const response = await client.echo(request)
			log("echo: ", response.getMessage(), " #", response.getMessageCount().toString())

		} catch (e) {
			logException(log, "echo", e)
		}
	}

	const echoAbort = async () => {
		try {
			const request = new EchoRequest()
			request.setMessage(message)

			const response = await client.echoAbort(request)
			log("echoAbort: ", response.getMessage(), " #", response.getMessageCount().toString())

		} catch (e) {
			logException(log, "echoAbort", e)
		}
	}

	const noOp = async () => {
		try {
			const request = new Empty()
			await client.noOp(request)
			log("noOp")
		} catch (e) {
			logException(log, "noOp", e)
		}
	}

	const serverStreamingEcho = async () => {
		try {
			const request = new ServerStreamingEchoRequest()
			request.setMessage(message)
			request.setMessageCount(messageCount)
			request.setMessageInterval(messageInterval)

			const stream = client.serverStreamingEcho(request)
			logStream(log, "serverStreamingEcho", stream)

		} catch (e) {
			logException(log, "serverStreamingEcho", e)
		}
	}

	const serverStreamingEchoAbort = async () => {
		try {
			const request = new ServerStreamingEchoRequest()
			request.setMessage(message)
			request.setMessageCount(messageCount)
			request.setMessageInterval(messageInterval)

			const stream = client.serverStreamingEchoAbort(request)
			logStream(log, "serverStreamingEchoAbort", stream)
		} catch (e) {
			logException(log, "serverStreamingEchoAbort", e)
		}
	}

	return (<>
		<h3>Echo Client</h3>
		<table><tbody>
			<tr><td>Message</td><td>
				<input value={message}
					onChange={ev => setMessage(ev.target.value)}
				/>
			</td></tr>
			<tr><td>Message Count</td><td>
				<input value={messageCount} type="number"
					onChange={ev => setMessageCount(ev.target.valueAsNumber)}
				/>
			</td></tr>
			<tr><td>Message Interval</td><td>
				<input value={messageInterval} type="number"
					onChange={ev => setMessageInterval(ev.target.valueAsNumber)}
				/>
			</td></tr>
		</tbody></table>
		<p>
			<button onClick={echo}>Echo</button>{' '}
			<button onClick={echoAbort}>EchoAbort</button>
		</p>
		<p>
			<button onClick={noOp}>NoOp</button>
		</p>
		<p>
			<button onClick={serverStreamingEcho}>ServerStreamingEcho</button>{' '}
			<button onClick={serverStreamingEchoAbort}>ServerStreamingEchoAbort</button>
		</p>
	</>)
}
