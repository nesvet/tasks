import os from "node:os";
import { Err } from "@nesvet/n";
import EventEmitter from "eventemitter3";
import { type Tasks } from "./Tasks.js";


export class Task extends EventEmitter {
	constructor(tasks: Tasks, args: unknown[]) {
		super();
		
		this.tasks = tasks;
		
		this.args = args;
		
	}
	
	args: unknown[];
	
	tasks: Tasks;
	
	availableParallelism = os.availableParallelism();
	
	isAborted = false;
	
	onAbort?(error: Error): unknown;
	
	status = "idle";
	state: Record<string, unknown> = {
		result: null,
		error: null
	};
	
	setState(state: object) {
		Object.assign(this.state, state);
		this.emit("state", this);
		
	}
	
	async abort(error = new Err("Aborted", "aborted")) {
		
		this.state.error = error;
		
		this.isAborted = true;
		
		await this.onAbort?.(error);
		
		this.reject?.(error);
		
	}
	
	#promise?: Promise<unknown>;
	
	reject?(error?: Error): void;
	
	do?(...args: unknown[]): Promise<unknown>;
	
	whenExecuted() {
		return this.#promise;
	}
	
	execute() {
		
		this.status = "executing";
		this.emit("executing");
		
		return (
			this.#promise = new Promise((resolve, reject) => {
				this.reject = reject;
				
				this.do?.(...this.args).then(resolve, reject);
				
			}).then(result => {
				
				this.status = "success";
				this.setState({ result });
				this.emit("success", result);
				
				return result;
			}, error => {
				if (!error.tag)
					console.error(error);
				
				this.status = "error";
				this.setState({ error });
				this.emit("error", error);
				
				throw error;
			})
		);
	}
	
}
