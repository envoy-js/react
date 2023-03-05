import {ChatServerProvider, Messenger} from "@envoy/react";

import React from "react";

interface Message {
    room_id: string,
    content: string
}

interface Room {
    id: string
}

const messenger = new Messenger<Message, Room>(
    "ws://localhost:3000",
    "id",
    (m) => m.room_id
)

export function ExampleMessenger() {
    return <messenger.ChatServerProvider messenger={messenger}>
        <ChatRooms/>
    </messenger.ChatServerProvider>
}

export function ChatRooms() {
    const {createRoom, rooms} = messenger.useChatServer()
    return (
        <>
            {
                (rooms || []).map((r: RoomWrapper) => <ExampleChat room={r.room}/>)
            }
        </>
    )
}

export function ExampleChat(props: { room: { id: string } }) {
    const {sendMessage, messages} = messenger.useChatroom(props.room.id)

    return <div>
        {(messages || []).map((m: Message) => <div>{m.content}</div>)}
    </div>
}