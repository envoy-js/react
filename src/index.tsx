import React, {useMemo, useState} from "react";

import {io} from "socket.io-client";

export class Messenger<MessageType, RoomType> {
    ws_url: string
    room_key: keyof RoomType
    getRoomIDFromMessage

    constructor(ws_url: string, room_key: keyof RoomType, getRoomIDFromMessage: ((m: MessageType) => any)) {
        this.ws_url = ws_url
        this.room_key = room_key
        this.getRoomIDFromMessage = getRoomIDFromMessage
    }


    public useChatroom(room_id: number | string): {
        sendMessage: ((message: any) => void) | null,
        messages: MessageType[] | null,
        errored: boolean,
    } {
        const {rooms, messenger, connection} = this.useChatServer()
        const roomWrapper = useMemo(() => (rooms || []).find(r => r.room[messenger.room_key] == room_id), [rooms, room_id])

        return useMemo(() => ({
            sendMessage: roomWrapper ? (m: any) => connection.sendMessage(roomWrapper.room[messenger.room_key], m) : null,
            messages: [],
            errored: roomWrapper === null
        }), [roomWrapper, connection, messenger])
    }

    public useChatServer(): ChatServerState<MessageType, RoomType> {
        let val = React.useContext(ChatServerContext)
        if (val == null) {
            throw new Error("Cannot use useChatServer outside of ChatServerContext")
        }
        return val as ChatServerState<MessageType, RoomType>;
    }


}

export const ChatServerContext = React.createContext<ChatServerState<any, any> | null>(null);

export function ChatServerProvider<MessageType, RoomType>(props: { messenger: Messenger<MessageType, RoomType>, children: React.ReactNode }) {
    const [rooms, setRooms] = useState<RoomWrapper<MessageType, RoomType>[] | null>(null)
    const connection = useMemo(() => new ReactChatConnection<MessageType, RoomType>(props.messenger, setRooms), [props.messenger])

    const state: ChatServerState<MessageType, RoomType> = useMemo(() => ({
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

interface ChatServerState<MessageType, RoomType> {
    connection: ReactChatConnection<MessageType, RoomType>,
    rooms: RoomWrapper<MessageType, RoomType>[] | null,
    messenger: Messenger<MessageType, RoomType>,
    createRoom: (name: string) => void,
    joinRoom: (room: RoomType) => void,
    leaveRoom: (room: RoomType) => void,
}

export class ReactChatConnection<MessageType, RoomType> {
    setRooms
    public socket
    public messenger

    constructor(messenger: Messenger<MessageType, RoomType>, setRooms: any) {
        this.messenger = messenger
        this.socket = io(messenger.ws_url, {transports: ["websocket"]})
        this.setRooms = setRooms

        this.socket.on("serverMessage", (message: MessageType) => {
            setRooms((rooms: RoomWrapper<MessageType, RoomType>[]) => {
                if (this.messenger.getRoomIDFromMessage) {
                    for (const room of rooms) {
                        if (room.room[this.messenger.room_key] === this.messenger.getRoomIDFromMessage(message)) {
                            room.messages.push(message)
                        }
                    }
                    return rooms
                }
            })
        })

        this.socket.on("allRooms", (rooms: RoomWrapper<MessageType, RoomType>[]) => {
            setRooms(rooms)
        })
    }

    sendMessage(room_id: any, message: any) {
        this.socket.emit("clientMessage", message)
    }

    createRoom(name: string) {
        // this.socket.emit()
    }

    joinRoom(room: RoomType) {
        this.socket.emit("clientJoinRoom", room)
    }

    leaveRoom(room: RoomType) {
        this.socket.emit("clientLeaveRoom", room)
    }
}

export interface RoomWrapper<MessageType, RoomType> {
    messages: MessageType[],
    room: RoomType
}

