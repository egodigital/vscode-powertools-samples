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
    const _ = args.require('lodash');
    const helpers = args.require('./helpers');
    const vscode = args.require('vscode');

    switch (args.event) {
        case 'on.command':
            switch (args.data.command) {
                case 'generate_passwords':
                    // web view requests to generate passwords
                    {
                        let err;
                        const PASSWORDS = [];
                        let cancelled;
                        try {
                            const crypto = args.require('crypto');

                            let allowedChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

                            const COUNT = args.data.data.count;
                            const LEN = args.data.data.length;
                            
                            cancelled = await vscode.window.withProgress({
                                cancellable: true,
                                location: vscode.ProgressLocation.Notification,
                                title: 'Password Generator'
                            }, async (progress, token) => {
                                for (let i = 0; i < COUNT; i++) {
                                    if (token.isCancellationRequested) {
                                        return true;
                                    }

                                    try {
                                        progress.report({
                                            message: `Generating password ${ i + 1 } / ${ COUNT } ...`,
                                            increment: (i + 1) / COUNT * 100.0,
                                        });

                                        const RANDOM_BYTES = await (() => {
                                            return new Promise((resolve, reject) => {
                                                try {
                                                    crypto.randomBytes(LEN * 4, (err, buf) => {
                                                        if (err) {
                                                            reject(err);
                                                        } else {
                                                            resolve(buf);
                                                        }
                                                    });
                                                } catch (e) {
                                                    reject(e);
                                                }
                                            });
                                        })();

                                        let newPassword = '';
                                        for (let j = 0; j < LEN; j++) {
                                            const B = RANDOM_BYTES.readUInt32LE(j * 4);
                                            const C = allowedChars[B % allowedChars.length];

                                            newPassword += C;
                                        }

                                        PASSWORDS.push(
                                            newPassword
                                        );
                                    } catch (e) {
                                        args.logger
                                            .trace(e, 'App.password-generator');
                                    }
                                }

                                return false;
                            });
                        } catch (e) {
                            err = helpers.errorToString(e);
                        }

                        const SUCCESS = _.isNil(err);
                        await args.post(
                            'passwords_generated',
                            {
                                success: SUCCESS,
                                error: SUCCESS ? undefined : err,
                                cancelled: SUCCESS ? cancelled : undefined,
                                passwords: SUCCESS ? PASSWORDS : undefined,
                            }
                        );
                    }
                    break;
            }
            break;
    }
};

/**
 * This returns the title, which is displayed in the tab
 * of the web view.
 */
exports.getTitle = () => {
    return "Password Generator";
};

/**
 * This returns the HTML code for the body.
 */
exports.getHtml = (args) => {
    return args.renderFile(
        'view.ejs'
    );
};
