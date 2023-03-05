import React, {useMemo, useState} from "react";

import {io} from "socket.io-client";

export class Messenger<MessageType, RoomType, UserType> {
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
            messages: roomWrapper?.messages || [],
            errored: roomWrapper === null
        }), [roomWrapper, connection, messenger])
    }

    public useChatServer(): ChatServerState<MessageType, RoomType, UserType> {
        let val = React.useContext(ChatServerContext)
        if (val == null) {
            throw new Error("Cannot use useChatServer outside of ChatServerContext")
        }
        return val as ChatServerState<MessageType, RoomType, UserType>;
    }


}

export const ChatServerContext = React.createContext<ChatServerState<any, any, any> | null>(null);

export function ChatServerProvider<MessageType, RoomType, UserType>(props: { messenger: Messenger<MessageType, RoomType, UserType>, children: React.ReactNode }) {
    const [rooms, setRooms] = useState<RoomWrapper<MessageType, RoomType>[] | null>(null)
    const [me, setMe] = useState<UserType | null>(null)
    const connection = useMemo(() => new ReactChatConnection<MessageType, RoomType, UserType>(props.messenger, setRooms, setMe), [props.messenger])

    const state: ChatServerState<MessageType, RoomType, UserType> = useMemo(() => ({
        rooms: rooms,
        createRoom: connection.createRoom,
        joinRoom: connection.joinRoom,
        leaveRoom: connection.leaveRoom,
        messenger: props.messenger,
        connection,
        me
    }), [connection, props.messenger, rooms])

    return <ChatServerContext.Provider value={state}>
        {props.children}
    </ChatServerContext.Provider>
}

interface ChatServerState<MessageType, RoomType, UserType> {
    connection: ReactChatConnection<MessageType, RoomType, UserType>,
    rooms: RoomWrapper<MessageType, RoomType>[] | null,
    messenger: Messenger<MessageType, RoomType, UserType>,
    createRoom: (name: string) => void,
    joinRoom: (room: RoomType) => void,
    leaveRoom: (room: RoomType) => void,
    me: UserType | null
}

export class ReactChatConnection<MessageType, RoomType, UserType> {
    setRooms
    public socket
    public messenger

    constructor(messenger: Messenger<MessageType, RoomType, UserType>, setRooms: any, setMe: any) {
        this.messenger = messenger
        this.socket = io(messenger.ws_url, {transports: ["websocket"]})
        this.setRooms = setRooms

        this.socket.on("serverMessage", (message: MessageType) => {
            console.log("Received message: ", message)
            setRooms((rooms: RoomWrapper<MessageType, RoomType>[]) => {
                if (this.messenger.getRoomIDFromMessage) {
                    return rooms.map(room => {
                        console.log(room.room[this.messenger.room_key], this.messenger.getRoomIDFromMessage(message))
                        if (room.room[this.messenger.room_key] === this.messenger.getRoomIDFromMessage(message)) {
                            room.messages = [...room.messages, message]
                        }

                        return {...room}
                    })
                }
            })
        })

        this.socket.on("allRooms", (rooms: RoomWrapper<MessageType, RoomType>[]) => {
            console.log("Rooms received: ", rooms)
            setRooms(rooms)
        })

        this.socket.on("userLogin", (user: UserType) => {
            console.log("USER LOGIN", user)
            setMe(user)
        })
    }

    sendMessage(room_id: any, message: MessageType) {
        console.log("Sending message: ", message)
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

