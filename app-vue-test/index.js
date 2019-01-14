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
 * We only need 'ejs' for including the correct
 * path of 'vue.min.js' script.
 */
exports.getHtml = (args) => {
    return args.renderFile(
        'view.ejs',
        {
            'vue_js': args.getFileResourceUri('vue.min.js'),
        }
    );
};

/**
 * Is invoked on an event.
 */
exports.onEvent = async (args) => {
    // args => https://egodigital.github.io/vscode-powertools/api/interfaces/_contracts_.appeventscriptarguments.html

    // s. https://code.visualstudio.com/api/references/vscode-api
    const vscode = args.require('vscode');

    switch (args.event) {
        case 'on.command':
            // is invoked, when the web view has
            // been post a (command) message
            
			const COMMAND_NAME = args.data.command;
            const COMMAND_DATA = args.data.data;
            if ('hello_from_webview' === COMMAND_NAME) {
                // we received a message from
                // 'view.ejs'
                await args.post('hello_from_extension',
                                {
                                    'newMessage': 'Hello, e.GO!'
                                });
            }
            break;

        case 'on.loaded':
            // page inside web view has been completely loaded
            break;

        case 'on.hidden':
            // web view has went to the background
            break;
        case 'on.shown':
            // web view has went to the foreground
            break;

        case 'on.disposed':
            // the web view has been disposed
            break;
    }
};

/**
 * This returns the title, which is displayed in the tab
 * of the web view.
 */
exports.getTitle = () => {
    return "Vue Test";
};

