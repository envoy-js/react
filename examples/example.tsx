import {ChatServerProvider, Messenger, Room, useChatroom, useChatServer} from "@envoy/react";

import React from "react";

const messenger = new Messenger(
    "ws://localhost:3000",
    "id"
)

export function ExampleMessenger() {
    return <ChatServerProvider messenger={messenger}>
        <ChatRooms/>
    </ChatServerProvider>
}

export function ChatRooms() {
    const {createRoom, rooms} = useChatServer()
    return (
        <>
            {
                (rooms || []).map(r => <ExampleChat room={r}/>)
            }
        </>
    )
}

export function ExampleChat(props: { room: Room }) {
    const {sendMessage, messages} = useChatroom(props.room.id)

    return <div>
        {(messages || []).map(m => <div/>)}
    </div>
}