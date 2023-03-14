<script>
    export const from_me = false
    export const from_me_bg = "lightblue"
    export const from_them_bg = "lightgrey"
    export const margin = "15px"
</script>

<div class="message-row from-me-row"
    style={ `flex-direction: ${ from_me ? "row-reverse" : "row"}` }
>

    <div class="message-spacer"></div>

    <div class="message-bubble from-me-bubble"
        style={from_me ?
            `margin-left: ${margin};` : `margin-right: ${margin}`
            + `background-color: ${ from_me ? from_me_bg : from_them_bg }`
        }
    >
        <slot/>
    </div>

</div>

<style>
    div { /*For debugging */
        border: 1px solid black;
    }

    .message-row {
        display: flex;
        margin-top: 8px;
        margin-bottom: 8px;
    }

    .message-bubble {
        overflow-wrap: break-word; /*So that max-width is not ignored max-width if a word is too long*/
        border-radius: 8px;
        padding: 4px;
    }

</style>
