<script>
    export let from =""
    export let from_me = false
    export let from_me_bg = "lightblue"
    export let from_them_bg = "lightgrey"
    export let margin = "15px"
</script>

<div class="message-row from-me-row"
    style={ `flex-direction: ${ from_me ? "row-reverse" : "row"}` }
>

    <div class="message-spacer"></div>

    <div class="message-bubble"
        style={
            `background-color: ${ from_me ? from_me_bg : from_them_bg } ; ` +
            (from_me ? `margin-left: ${margin};` : `margin-right: ${margin} ;`) 
        }
    >
        <div> {from} </div>
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
