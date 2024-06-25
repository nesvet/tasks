import os from "node:os";
import EventEmitter from "eventemitter3";
import { areArraysEqual, Err, noop } from "@nesvet/n";
import type { Task } from "./Task";


const availableParallelism = os.availableParallelism();

type TaskUnknown = typeof Task<unknown>;
type GenericGlossary = Record<string, TaskUnknown>;
type ValueInstance<T extends GenericGlossary> = InstanceType<T[keyof T]>;
type StringKey<T> = Extract<keyof T, string>;


export class Tasks<Glossary extends GenericGlossary> extends EventEmitter {
	constructor(glossary: Glossary) {
		super();
		
		this.#glossary = glossary;
		
	}
	
	#glossary;
	
	availableParallelism = availableParallelism;
	
	running = new Map<StringKey<Glossary>, ValueInstance<Glossary>>();
	
	do(taskName: StringKey<Glossary>, ...taskArgs: unknown[]) {
		const TheTask = this.#glossary[taskName];
		
		if (!TheTask)
			throw new Err(`No such task name: ${String(taskName)}`, "taskdoesnotexist");
		
		let task = this.running.get(taskName);
		
		if (task && areArraysEqual(task.args, taskArgs))
			return task;
		
		task = new TheTask(taskArgs) as ValueInstance<Glossary>;
		
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
	
}
