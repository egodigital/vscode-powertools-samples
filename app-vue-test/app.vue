<template>
    <v-container fluid>
        <h1>My Vuetify app</h1>

        <pre id="ego-test">{{ last_message_from_js_file }}</pre>
    </v-container>
</template>

<script>

// the web view searches for a global 'PAGE' variable or constant, which
// contains an object, that works the same way as described here:
// https://vuejs.org/v2/guide/instance.html
const PAGE = {
    data: function() {
        return {
            last_message_from_js_file: 'n.a.',
        };
    },    

    methods: {
        // this is a special hook, used by the extension
        // to receive messages from code-behind (.js file), which
        // is directly connected to Visual Studio Code instance
        $onCommand: function(command, data) {
            // command => The name of the command
            //            from 'onEvent' function in '.js' file
            // data    => The (optional) data
            //            from 'onEvent' function in '.js' file

            this.last_message_from_js_file =
                'From "index.js": ' + JSON.stringify([command, data], null, 2);
        },
    },

    mounted: function() {
        // this sends data to
        // 'onEvent' function of
        // 'index.js' file
        this.$post('hello_from_webview_command', {
            'message': 'Hello, Echo!'
        });
    },
};

</script>

<style>

#ego-test {
    color: #ffffff;
    background-color: red;
    font-weight: bold;
}

</style>
