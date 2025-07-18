import os from "node:os";
import EventEmitter from "eventemitter3";
import {
	areArraysEqual,
	Err,
	noop,
	StringKey
} from "@nesvet/n";
import type { Glossary, Options, ValueInstance } from "./types";


/* eslint-disable @typescript-eslint/no-explicit-any */


const availableParallelism = os.availableParallelism();


export class Tasks<G extends Glossary> extends EventEmitter {
	constructor(glossary: G, taskOptions?: Options) {
		super();
		
		this.#glossary = glossary;
		
		this.#taskOptions = taskOptions;
		
	}
	
	#glossary;
	
	#taskOptions;
	
	availableParallelism = availableParallelism;
	
	running = new Map<StringKey<G>, ValueInstance<G>>();
	
	do(taskName: StringKey<G>, ...taskArgs: any[]) {
		const TheTask = this.#glossary[taskName];
		
		if (!TheTask)
			throw new Err(`No such task name: ${String(taskName)}`, "taskdoesnotexist");
		
		let task = this.running.get(taskName);
		
		if (task && areArraysEqual(task.args, taskArgs))
			return task;
		
		task = new TheTask(taskArgs, this.#taskOptions) as ValueInstance<G>;
		
		this.running.set(taskName, task);
		
		const handleState = () => this.emit(`${taskName}.state`, task);
		const handleError = () => this.emit(`${taskName}.error`, task);
		
		task.on("state", handleState);
		task.on("error", handleError);
		
		task.execute().catch(noop).finally(() => {
			
			task.off("state", handleState);
			task.off("error", handleError);
			
			this.running.delete(taskName);
			
			this.emit(`${taskName}.end`, task);
			
		});
		
		this.emit(`${taskName}.begin`, task);
		
		return task;
	}
	
	
	static availableParallelism = availableParallelism;
	
	static init<L extends Glossary>(glossary: L, taskOptions?: Options) {
		return new Tasks(glossary, taskOptions);
	}
	
}
