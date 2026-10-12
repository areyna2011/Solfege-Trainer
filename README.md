# Solfège Trainer

A standalone classroom app for Music with Mr. Reyna. No accounts, build tools, internet fonts, or external media services are required.

## Open the app

Open `index.html` in a modern browser, or serve this folder with a local static web server. Keep `styles.css`, `patterns.js`, `app.js`, and the `assets` folder alongside `index.html`.

## Practice

- Select None, First, or All for the initial syllable support on each new pattern.
- Reveal syllables advances the current pattern from None to First to All. It does not change the initial support setting.
- Starting pitch and Play pattern use the supplied piano recordings. Starting another recording or changing patterns stops the current audio.
- Next pattern draws from the enabled patterns. With one pattern selected, Next is disabled.

## Audiation

Choose a duration from 1 to 30 seconds and press Start audiation. The timer begins only after the notation has loaded. The score is then hidden and the class is prompted to sing from memory. Reveal pattern restores the original score and support level. Restart audiation repeats the current pattern.

Changing modes or the enabled pattern selection cancels the round. Switching away from the browser tab hides an active audiation pattern and stops the short piano recording.

## Background music

Use the player below the lesson controls to play the supplied Solfège practice backing track. Playback starts only when you press Play, at 35% volume. The player includes pause, seeking, and volume controls where supported by the browser. Repeat toggles continuous looping. Background music continues across pattern and mode changes, independently of the short piano recordings.

## Teacher settings

Expand Teacher settings to select individual patterns or all/none. Sequential order follows enabled pattern numbers and wraps. Random order excludes the current pattern when at least two are enabled. An empty selection disables lesson actions and shows instructions.

Selections, order, support, and viewing duration are saved only in this browser when local storage is available. The app still works if storage is unavailable. Full screen is shown when the browser supports it.

## GitHub Pages

1. Extract `solfege-trainer-github-pages.zip` on your computer.
2. Create a GitHub repository (for example, `solfege-trainer`). Use a public repository for GitHub Free hosting.
3. Upload the extracted files and the entire `assets` folder to the repository root and commit them to `main`. Upload the contents, not the ZIP or an enclosing folder. `index.html` should be visible at the top level.
4. In the repository, open **Settings > Pages**. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select **main** and **/(root)**, then click **Save**.
6. Wait for deployment to finish; the Pages settings will show the published site link.

The package includes `.nojekyll` (a hidden file on macOS), which disables Jekyll processing. No installation or build command is needed. Relative asset paths support hosting under a repository subpath. Hosting has not been configured or published by this package.

Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

The footer's **View Other Apps** button opens https://www.austinreyna.com/web-apps in a new tab.

## Assets and maintenance

- `assets/patterns`: 51 PNGs exported from the three supplied PDFs, using the same crop for stable positioning across support levels.
- `assets/audio`: 34 original WAV recordings copied with consistent lowercase filenames, plus the supplied MP3 backing track. Pattern 17 Full is the recording originally named Pattern 17 Starting_1.
- `assets/logo.png`: existing Music with Mr. Reyna logo from Rhythmic Grid.
- `patterns.js`: numbered pattern-to-asset mapping.
- `tools/prepare_assets.py`: optional export script in the original source folder, requiring Python, pypdfium2, and Pillow. Not needed to run the app and excluded from the deployment ZIP. The original PDFs, PNGs, audio, Dorico, and MIDI files remain intact in the source folder and are also excluded from the deployment ZIP.

The typography uses the same local font stack as the existing apps: Aktiv Grotesk, Helvetica Neue, Arial, sans-serif. No font is downloaded.
