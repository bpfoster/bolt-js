import { SlackEvent } from '@slack/types';
import { StringIndexed } from '../helpers';
import { SayFn } from '../utilities';

// TODO: for backwards compatibility; remove at next major (breaking change)
export * from '@slack/types';

/**
 * Arguments which listeners and middleware receive to process an event from Slack's Events API.
 */
export interface SlackEventMiddlewareArgs<EventType extends string = string> {
  payload: EventFromType<EventType>;
  event: this['payload'];
  message: EventType extends 'message' ? this['payload'] : undefined;
  body: EnvelopedEvent<this['payload']>;
  say: WhenEventHasChannelContext<this['payload'], SayFn>;
  // Add `ack` as undefined for global middleware in TypeScript
  ack?: undefined;
}

interface BaseSlackEvent<T extends string = string> {
  type: T;
}
export type EventTypePattern = string | RegExp;
export type FunctionInputs = Record<string, unknown>;

/**
 * A Slack Events API event wrapped in the standard envelope.
 *
 * This describes the entire JSON-encoded body of a request from Slack's Events API.
 */
interface EnvelopedEvent<Event = BaseSlackEvent> extends StringIndexed {
  token: string;
  team_id: string;
  enterprise_id?: string;
  api_app_id: string;
  event: Event;
  type: 'event_callback';
  event_id: string;
  event_time: number;
  // TODO: the two properties below are being deprecated on Feb 24, 2021
  authed_users?: string[];
  authed_teams?: string[];
  is_ext_shared_channel?: boolean;
  authorizations?: Authorization[];
}

interface Authorization {
  enterprise_id: string | null;
  team_id: string | null;
  user_id: string;
  is_bot: boolean;
  is_enterprise_install?: boolean;
}

/**
 * Type function which given a string `T` returns a type for the matching Slack event(s).
 *
 * When the string matches known event(s) from the `SlackEvent` union, only those types are returned (also as a union).
 * Otherwise, the `BasicSlackEvent<T>` type is returned.
 */
export type EventFromType<T extends string> = KnownEventFromType<T> extends never ?
  BaseSlackEvent<T> :
  KnownEventFromType<T>;
export type KnownEventFromType<T extends string> = Extract<SlackEvent, { type: T }>;

/**
 * Type function which tests whether or not the given `Event` contains a channel ID context for where the event
 * occurred, and returns `Type` when the test passes. Otherwise this returns `undefined`.
 */
type WhenEventHasChannelContext<Event, Type> = Event extends { channel: string } | { item: { channel: string } }
  ? Type
  : undefined;
