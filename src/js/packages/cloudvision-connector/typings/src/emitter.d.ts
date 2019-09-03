import { EventCallback } from '../types';
import { EmitterEvents } from '../types/emitter';
/**
 * A class that tracks event callbacks by event type.
 * Callbacks get triggered, when an **emit** event is invoked for a given
 * event type.
 */
declare class Emitter {
    private events;
    constructor();
    /**
     * Returns the `Map` of events
     */
    getEventsMap(): EmitterEvents;
    /**
     * Returns true if and only if the emitter has callback(s) of the event type
     */
    has(eventType: string): boolean;
    /**
     * Adds the given callback to the event type.
     *
     * @returns The number of callbacks subscribed to the event type
     */
    bind(eventType: string, callback: EventCallback): number;
    /**
     * Removes the given callback from the event type.
     * If this is the last callback subscribed to the given event type, then
     * the event type is removed from the `Map` of events.
     *
     * @returns The number of callbacks subscribed to the event type, or null
     * if the callback is not present in the `Map` of events.
     */
    unbind(eventType: string, callback: EventCallback): number | null;
    /**
     * Removes all callbacks for the given event.
     * This removes the event type from the `Map` of events.
     */
    unbindAll(eventType: string): void;
    /**
     * Triggers all callbacks bound to the given event type. The function can
     * take extra arguments, which are passed to the callback functions.
     */
    emit(eventType: string, ...args: unknown[]): void;
    /**
     * Unbinds all callbacks for all events.
     * This clears the `Map` of events.
     */
    close(): void;
}
export default Emitter;
