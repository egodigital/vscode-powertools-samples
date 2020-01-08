// The MIT License (MIT)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER


/**
 * Is invoked on an event.
 */
exports.onEvent = async (args) => {
    // args => s. https://egodigital.github.io/vscode-powertools/api/interfaces/_contracts_.appeventscriptarguments.html

    // s. https://code.visualstudio.com/api/references/vscode-api
    const vscode = args.require('vscode');

    switch (args.event) {
        case 'on.command':
            // is invoked, when the web view has
            // been post a (command) message
            {
                if ('hello_from_webview_command' === args.data.command) {
                    // this has been send from
                    // 'mounted()' hook
                    // in 'my_vuetify_app.vue'

                    vscode.window.showInformationMessage(
                        'From "app.vue": ' + JSON.stringify(args.data.data, null, 2)
                    );

                    // send this back to 'my_vuetify_app.ejs'
                    await args.post('hello_back_from_extension', {
                        'message': 'Hello, Otto!'
                    });
                }
            }
            break;
    }
};


/**
 * This returns the title, which is displayed in the tab
 * of the web view.
 */
exports.getTitle = (args) => {
    // args => https://egodigital.github.io/vscode-powertools/api/interfaces/_contracts_.appeventscriptarguments.html

    return "My Vuetify app";
};

/**
 * This returns the Vue content for the body.
 */
exports.getHtml = (args) => {
    // args => https://egodigital.github.io/vscode-powertools/api/interfaces/_contracts_.appeventscriptarguments.html

    return args.readTextFile(
        __dirname + '/app.vue'
    );
};
