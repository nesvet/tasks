import { areArraysEqual, Err, noop } from "@nesvet/n";
import EventEmitter from "eventemitter3";
import { Task } from "./Task";


export class Tasks extends EventEmitter {
	constructor(tasksAvailable: Record<string, Task>) {
		super();
		
		Object.assign(this.#available, tasksAvailable);
		
	}
	
	running = new Map<string, Task>();
	
	#available: Record<string, Task> = {};
	
	do(taskName: string, ...taskArgs: unknown[]) {
		const TheTask = this.#available[taskName] as unknown as typeof Task;
		
		if (!TheTask)
			throw new Err(`No such task name: ${taskName}`, "taskdoesnotexist");
		
		let task = this.running.get(taskName);
		
		if (task && areArraysEqual(task.args, taskArgs))
			return task;
		
		task = new TheTask(this, taskArgs);
		
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
	
}
