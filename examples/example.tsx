import {ChatServerProvider, Messenger, useChatroom, useChatServer} from "@envoy/react";

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
    const {createRoom, rooms} = useChatServer<{}, { id: string }>()
    return (
        <>
            {
                (rooms || []).map(r => <ExampleChat room={r.room}/>)
            }
        </>
    )
}

export function ExampleChat(props: { room: { id: string } }) {
    const {sendMessage, messages} = useChatroom(props.room.id)

    return <div>
        {(messages || []).map(m => <div/>)}
    </div>
}