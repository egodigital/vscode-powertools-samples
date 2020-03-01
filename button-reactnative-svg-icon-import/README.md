# Button (reactnative-svg-icon-import)

Imports a SVG file from clipboard, active editor or external file and optimize it via [oxipng](https://github.com/shssoichiro/oxipng). Executables, can be found in [./oxipng](./oxipng) folder.

The exported PNG files (via `rsvg-convert`) can be used as assets in [React Native](https://reactnative.dev/) projects.

First, add an entry to your `buttons` section of your `settings.json`, inside your `.vscode` subfolder:

```json
{
    "ego.power-tools": {
        "buttons": [
            {
                "action": {
                    "script": "import_svg_icon.js",
                    "type": "script"
                },
                "text": "$(file-media)  Import SVG icon ..."
            }
        ]
    }
}
```

Now create a file, called `import_svg_icon.js`, inside your `.vscode` subfolder:

```javascript
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');


exports.execute = async (args) => {
  // args => https://egodigital.github.io/vscode-powertools/api/interfaces/_contracts_.buttonactionscriptarguments.html

  // s. https://github.com/egodigital/vscode-powertools/blob/master/src/helpers.ts
  // s. https://github.com/mkloubert/vscode-helpers
  const helpers = args.require('./helpers');
  // s. https://www.npmjs.com/package/opn
  const opn = args.require('opn');
  // s. https://code.visualstudio.com/api/references/vscode-api
  const vscode = args.require('vscode');
  // s. https://www.npmjs.com/package/xml2js
  const xml = args.require('xml2js');

  const str = (val) => {
    if (val instanceof Error) {
      return `[${val.name}] '${val.message}'

${val.stack}`;
    }

    return helpers.toStringSafe(val);
  };

  const write = (val) => {
    args.output.append(
      str(val)
    );
  };
  const write_ln = (val) => {
    args.output.appendLine(
      str(val)
    );
  };

  let bringOutputToFocus = false;

  args.output.appendLine(``);
  args.output.appendLine(`Import SVG icon ...`);

  try {
    // rsvg-convert
    try {
      child_process.execFileSync('rsvg-convert', ['-v']);
    } catch (e) {
      bringOutputToFocus = true;

      let url = 'http://manpages.ubuntu.com/manpages/xenial/man1/rsvg-convert.1.html';
      switch (process.platform) {
        case 'darwin':
          url = 'https://superuser.com/questions/877904/installing-rsvg-on-a-mac';
          break;

        case 'win32':
          url = 'https://chocolatey.org/packages/rsvg-convert';
          break;
      }

      write_ln(`'rsvg-convert' is not installed! Open '${url}' for more information.`);

      const PRESSED_BTN = await vscode.window.showWarningMessage(
        `'rsvg-convert' is not installed! Install it?`,
        'Yes', 'No'
      );

      if ('Yes' !== PRESSED_BTN) {
        return;
      }

      await opn(url, {
        wait: false,
      });

      return;
    }

    // oxipng
    let oxipng = false;
    let checkForExecPermissions = true;
    switch (process.platform) {
      case 'darwin':
        oxipng = 'oxipng_macos';
        break;

      case 'linux':
        oxipng = 'oxipng_linux';
        break;

      case 'win32':
        oxipng = 'oxipng_win32.exe';
        checkForExecPermissions = false;
        break;
    }

    if (oxipng) {
      // full path of oxipng
      oxipng = path.join(__dirname, './oxipng', oxipng);

      if (checkForExecPermissions) {
        try {
          fs.accessSync(oxipng, fs.constants.X_OK);
        } catch (e) {
          // cannot be executed

          write_ln(`'${relPath(oxipng)}' cannot be executed!`);

          const PRESSED_BTN = await vscode.window.showWarningMessage(
            `'oxipng' executable cannot be executed! Would you like to run 'chmod +x'?`,
            'Yes', 'No'
          );
      
          if (!PRESSED_BTN) {
            return;
          }
          
          if ('No' === PRESSED_BTN) {
            oxipng = false;
          } else if ('Yes' === PRESSED_BTN) {
            // chmod +x

            child_process.execFileSync('chmod', [
              '+x',
              oxipng
            ], {
              cwd: path.dirname(oxipng),
            });
          }
        }
      }
    }

    let svg;
    let fileName;
    const ASK_FOR_FILENAME = async () => {
      fileName = helpers.toStringSafe(
        await vscode.window.showInputBox({
          prompt: `Base name of the output files, like 'icon-home' ...`,
        })
      ).trim();

      if ('' === fileName) {
        return;
      }
    };

    if (!svg) {
      // first try via clipboard

      svg = await tryGetSVG(
        args,
        () => vscode.env.clipboard.readText(),
      );

      if (svg) {
        write_ln(`📋 Found valid SVG in CLIPBOARD`);

        await ASK_FOR_FILENAME();

        if ('' === fileName) {
          return;
        }
      }
    }

    if (!svg) {
      // now try active text editor

      const ACTIVE_EDITOR = vscode.window.activeTextEditor;
      if (ACTIVE_EDITOR) {
        svg = await tryGetSVG(
          args,
          () => ACTIVE_EDITOR.document.getText()
        );
        if (svg) {
          write_ln(`🖌️ Found valid SVG in ACTIVE EDITOR`);

          await ASK_FOR_FILENAME();

          if ('' === fileName) {
            return;
          }
        }
      }
    }

    if (!svg) {
      // last, but not least: try via open file dialog
    
      let svgFile = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters: {
          'SVG images': ['svg'],
        }
      });
    
      if (helpers.isEmptyString(svgFile)) {
        return;
      }
    
      svgFile = svgFile[0].fsPath;

      fileName = path.basename(
        svgFile, path.extname(svgFile)
      );

      svg = await tryGetSVG(
        args, () => fs.readFileSync(svgFile),
        true
      );

      if (svg) {
        write_ln(`🗃️ Found valid SVG in FILE '${svgFile}'`);
      }
    }

    if (!svg) {
      return;
    }

    let initialHeight = '';
    if (svg['svg']['$'] && svg['svg']['$']['height']) {
      initialHeight = '' + svg['svg']['$']['height'];
    }

    const HEIGHT = parseInt(
      await vscode.window.showInputBox({
        prompt: 'Input the height of the image ...',
        value: initialHeight,
      })
    );
    if (isNaN(HEIGHT)) {
      return;
    }

    const WORKSPACE_ROOT = path.join(
      __dirname, '../'
    );
    // base directory of your images
    const IMG_DIR = path.join(
      WORKSPACE_ROOT, 'assets/img' 
    );

    const OUTPUTS = [{
      factor: 1, suffix: '', dir: '/',
    }, {
      factor: 2, suffix: '@2x', dir: '/',
    }, {
      factor: 3, suffix: '@3x', dir: '/',
    }, {
      factor: 1, suffix: '', dir: '/drawable-hdpi',
    }, {
      factor: 2, suffix: '', dir: '/drawable-xhdpi',
    }, {
      factor: 3, suffix: '', dir: '/drawable-xxhdpi',
    }, {
      factor: 4, suffix: '', dir: '/drawable-xxxhdpi',
    }];

    await vscode.window.withProgress({
      cancellable: false,
      location: vscode.ProgressLocation.Notification,
    }, async (progress) => {
      const XML_BUILDER = new xml.Builder();
      const XML_STR = XML_BUILDER.buildObject(svg);

      for (const O of OUTPUTS) {
          // full path of PNG output file
        const PNG_FILE = path.join(
          IMG_DIR, O.dir, `${fileName}${O.suffix}.png`
        );

        progress.report({
          message: `Converting to '${PNG_FILE}' ...`,
        });

        await helpers.tempFile(async (tmp) => {
          fs.writeFileSync(tmp, XML_STR, 'utf8');

          // execute 'rsvg-convert'
          const IMG = child_process.execFileSync(
            `rsvg-convert`,
            [
              '-h',
              `${HEIGHT * O.factor}`,
              '-a',
              tmp
            ],
            {
              cwd: WORKSPACE_ROOT,
            }
          );

          write_ln();
          write(`⚙️ Exporting SVG with height ${HEIGHT * O.factor} (${O.factor}x) to '${relPath(PNG_FILE)}' ... `);
          fs.writeFileSync(PNG_FILE, IMG);

          const CUR_FILESIZE = fs.statSync(PNG_FILE).size;
          write_ln(`[✅ ${CUR_FILESIZE}]`);

          if (oxipng) {
            // optimize with oxipng

            try {
              write(`🗜️ Optimizing '${relPath(PNG_FILE)}' ... `);

              child_process.execFileSync(
                oxipng,
                ['-o', '6', '-i', '0', '--strip', 'all', PNG_FILE],
                {
                  cwd: path.dirname(PNG_FILE),
                }  
              );

              const NEW_FILESIZE = fs.statSync(PNG_FILE).size;
              write_ln(`[✅ ${NEW_FILESIZE} (${
                (NEW_FILESIZE / CUR_FILESIZE * 100.0)
                  .toFixed(1)
              }%)]`);
            } catch (e) {
              bringOutputToFocus = true;

              write_ln(`[❌ ${str(e)}]`);
            }
          }
        });
      }
    });
  } catch (e) {
    bringOutputToFocus = true;

    write_ln('🆘 ' + str(e));
  } finally {
    if (bringOutputToFocus) {
      args.output.show();
    }
  }
};


function relPath(p) {
  return path.relative(
    path.join(__dirname, '../../'),
    p
  );
}

async function tryGetSVG(args, dataProvider, throwOnError) {
  // s. https://github.com/egodigital/vscode-powertools/blob/master/src/helpers.ts
  // s. https://github.com/mkloubert/vscode-helpers
  const helpers = args.require('./helpers');
  // s. https://www.npmjs.com/package/xml2js
  const xml = args.require('xml2js');

  try {
    const DATA = helpers.toStringSafe(
      await Promise.resolve(
        dataProvider()
      )
    );
    if ('' === DATA.trim()) {
      return false;
    }

    const OBJ = await xml.parseStringPromise(DATA);

    if (OBJ['svg']) {
      return OBJ;
    }
  } catch (e) {
    if (throwOnError) {
      throw e;
    }
  }

  return false;
}
```
