import React, {useMemo, useState} from "react";

import {io} from "socket.io-client";

export interface Message {
    id: string,
    room_id: string,
    content: string,
    author_id: string
}

export interface Room {
    id: string,
    name: string,
}

export class Messenger<MessageType = Message, RoomType = Room> {
    ws_url: string
    room_key: keyof RoomType

    constructor(ws_url: string, room_key: keyof RoomType) {
        this.ws_url = ws_url
        this.room_key = room_key
    }
}

export function useChatroom(room_id: number | string): {
    sendMessage: ((message: any) => void) | null,
    messages: Message[] | null,
    name: string | null,
    errored: boolean,
} {
    const {rooms, messenger, connection} = useChatServer()
    const room = useMemo(() => (rooms || []).find(r => r.id == room_id), [rooms, room_id])

    return useMemo(() => ({
        sendMessage: room ? (m: any) => connection.sendMessage(room[messenger.room_key], m) : null,
        messages: [],
        name: room?.name || null,
        errored: room === null
    }), [room, connection, messenger])
}

interface ChatServerState {
    connection: ReactChatConnection,
    rooms: Room[] | null,
    messenger: Messenger,
    createRoom: (name: string) => void,
    joinRoom: (room: Room) => void,
    leaveRoom: (room: Room) => void,
}

export const ChatServerContext = React.createContext<ChatServerState | null>(null);

export const useChatServer = () => {
    let val = React.useContext(ChatServerContext)
    if (val == null) {
        throw new Error("Cannot use useChatServer outside of ChatServerContext")
    }
    return val;
}

export class ReactChatConnection<MessageType = Message, RoomType = Room> {
    setRooms
    public socket
    public messenger

    constructor(messenger: Messenger, setRooms: any) {
        this.messenger = messenger
        this.socket = io(messenger.ws_url)
        this.setRooms = setRooms
    }

    sendMessage(room_id: any, message: any) {
        this.socket.emit("clientMessage", message)
    }

    createRoom(name: string) {
        this.socket.emit()
    }

    joinRoom(room: RoomType) {
        this.socket.emit("clientJoinRoom", room)
    }

    leaveRoom(room: RoomType) {
        this.socket.emit("clientLeaveRoom", room)
    }
}

export function ChatServerProvider(props: { messenger: Messenger, children: React.ReactNode }) {
    const [rooms, setRooms] = useState<Room[] | null>(null)
    const connection = useMemo(() => new ReactChatConnection(props.messenger, setRooms), [props.messenger])

    const state: ChatServerState = useMemo(() => ({
        rooms: rooms,
        createRoom: connection.createRoom,
        joinRoom: connection.joinRoom,
        leaveRoom: connection.leaveRoom,
        messenger: props.messenger,
        connection
    }), [connection, props.messenger])

    return <ChatServerContext.Provider value={state}>
        {props.children}
    </ChatServerContext.Provider>
}

