import EventEmitter from "eventemitter3";
import { Err } from "@nesvet/n";
import { Tasks } from "./Tasks.js";


/* eslint-disable @typescript-eslint/no-explicit-any */


export class Task<Result> extends EventEmitter {
	constructor(args: any[]) {
		super();
		
		this.args = args;
		
	}
	
	args;
	
	availableParallelism = Tasks.availableParallelism;
	
	onAbort?(error: Error): any;
	
	status = "idle";
	state: Record<string, any> = {
		result: null,
		error: null
	};
	
	setState(state: object) {
		Object.assign(this.state, state);
		this.emit("state", this);
		
	}
	
	abort = async (error: Error = new Err("Aborted", "aborted")) => {
		if (!this.state.error) {
			this.status = "error";
			this.setState({ error });
			
			this.emit("error", error);
			await this.onAbort?.(error);
			
			this.reject?.(error);
		}
	};
	
	#promise?: Promise<Result>;
	
	reject?(error?: Error): void;
	
	do?(...args: any[]): Promise<Result>;
	
	whenExecuted() {
		return this.#promise!;
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
			}, this.abort) as Promise<Result>
		);
	}
	
	
	static availableParallelism = Tasks.availableParallelism;
	
}
