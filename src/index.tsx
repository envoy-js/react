import React, {useMemo, useState} from "react";

import {io} from "socket.io-client";

export class Messenger<MessageType, RoomType> {
    ws_url: string
    room_key: keyof RoomType

    constructor(ws_url: string, room_key: keyof RoomType) {
        this.ws_url = ws_url
        this.room_key = room_key
    }
}

export class ChatConnection<MessageType, RoomType> {
    public socket
    public messenger

    constructor(messenger: Messenger<MessageType, RoomType>) {
        this.messenger = messenger
        this.socket = io(messenger.ws_url)
    }

    sendMessage(room_id: any, message: any) {

    }

    createRoom(name: string) {

    }
}

export function useChatroom<MessageType, RoomType>(room_id: number | string): {
    sendMessage: ((message: any) => void) | null,
    messages: MessageType[] | null,
    errored: boolean,
} {
    const {rooms, messenger, connection} = useChatServer()
    const roomWrapper = useMemo(() => (rooms || []).find(r => r.room[messenger.room_key] == room_id), [rooms, room_id])

    return useMemo(() => ({
        sendMessage: roomWrapper ? (m: any) => connection.sendMessage(roomWrapper.room[messenger.room_key], m) : null,
        messages: [],
        errored: roomWrapper === null
    }), [roomWrapper, connection, messenger])
}

interface ChatServerState<MessageType, RoomType> {
    connection: ReactChatConnection<MessageType, RoomType>,
    rooms: RoomWrapper<MessageType, RoomType>[] | null,
    messenger: Messenger<MessageType, RoomType>,
    createRoom: (name: string) => void,
}

export const ChatServerContext = React.createContext<ChatServerState<any, any> | null>(null);

export function useChatServer<MessageType, RoomType>() {
    let val = React.useContext(ChatServerContext)
    if (val == null) {
        throw new Error("Cannot use useChatServer outside of ChatServerContext")
    }
    return val as ChatServerState<MessageType, RoomType>;
}

export class ReactChatConnection<MessageType, RoomType> extends ChatConnection<MessageType, RoomType> {
    setRooms

    constructor(messenger: Messenger<MessageType, RoomType>, setRooms: any) {
        super(messenger);
        this.setRooms = setRooms
    }
}

interface RoomWrapper<MessageType, RoomType> {
    messages: MessageType[],
    room: RoomType[]
}

export function ChatServerProvider<MessageType, RoomType>(props: { messenger: Messenger<MessageType, RoomType>, children: React.ReactNode }) {
    const [rooms, setRooms] = useState<RoomWrapper<MessageType, RoomType>[] | null>(null)
    const connection = useMemo(() => new ReactChatConnection<MessageType, RoomType>(props.messenger, setRooms), [props.messenger])

    const state: ChatServerState<MessageType, RoomType> = useMemo(() => ({
        rooms: rooms,
        createRoom: connection.createRoom,
        messenger: props.messenger,
        connection
    }), [connection, props.messenger])

    return <ChatServerContext.Provider value={state}>
        {props.children}
    </ChatServerContext.Provider>
}

