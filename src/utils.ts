import {TIME_STEP} from './config';

export function generateDateArray(intervalCount: number): Date[] {
	const dates: Date[] = [];
	const currentDate = new Date();
	currentDate.setHours(0, 0, 0, 0); // Set to start of the day (12 AM)

	for (let i = 0; i < intervalCount; i++) {
		const newDate = new Date(currentDate.getTime() + i * TIME_STEP);
		dates.push(newDate);
	}

	return dates;
}

export function radiansToDegrees(radians: number): number {
	return radians * (180 / Math.PI);
}
