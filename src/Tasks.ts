import os from "node:os";
import EventEmitter from "eventemitter3";
import {
	areArraysEqual,
	Err,
	noop,
	StringKey
} from "@nesvet/n";
import type { Task } from "./Task";


/* eslint-disable @typescript-eslint/no-explicit-any */


const availableParallelism = os.availableParallelism();

type Glossary = Record<string, typeof Task<any>>;
type ValueInstance<G extends Glossary> = InstanceType<G[keyof G]>;


export class Tasks<G extends Glossary> extends EventEmitter {
	constructor(glossary: G) {
		super();
		
		this.#glossary = glossary;
		
	}
	
	#glossary;
	
	availableParallelism = availableParallelism;
	
	running = new Map<StringKey<G>, ValueInstance<G>>();
	
	do(taskName: StringKey<G>, ...taskArgs: any[]) {
		const TheTask = this.#glossary[taskName];
		
		if (!TheTask)
			throw new Err(`No such task name: ${String(taskName)}`, "taskdoesnotexist");
		
		let task = this.running.get(taskName);
		
		if (task && areArraysEqual(task.args, taskArgs))
			return task;
		
		task = new TheTask(taskArgs) as ValueInstance<G>;
		
		this.running.set(taskName, task);
		
		const handleState = () => this.emit(taskName, task);
		
		task.on("state", handleState);
		
		task.execute().catch(noop).finally(() => {
			
			task.off("state", handleState);
			
			this.running.delete(taskName);
			
			this.emit(taskName, null);
			
		});
		
		this.emit(taskName, task);
		
		return task;
	}
	
	
	static availableParallelism = availableParallelism;
	
	static init<L extends Glossary>(glossary: L) {
		return new Tasks(glossary);
	}
	
}
