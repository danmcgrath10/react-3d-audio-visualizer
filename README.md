# React 3D Audio Visualizer
This project is a React-based application that creates a 3D audio visualizer using React Native and Three.js. 
It visualizes audio input through an amorphous, morphing 3D blob and a dynamic starfield background, creating an immersive audio-visual experience.

## Features
3D Audio Visualization: Utilizes the Web Audio API for audio analysis and Three.js for 3D graphics rendering.
Dynamic Visual Elements: Includes a morphing 3D blob that reacts to the audio's frequency and amplitude, and a starfield background for added visual depth.
Interactive UI: Offers play, pause, and seek functionalities for audio control, along with file input for audio selection.
## Installation
To set up the project locally, follow these steps:

### Clone the repository:
```sh
git clone https://github.com/danmcgrath10/react-3d-audio-visualizer.git
```
### Navigate to the project directory:
```sh
cd react-3d-audio-visualizer
```
### Install dependencies:
```sh
npx expo install
```
### Usage
To start the application, run:

```sh
npx expo start
```
This will launch the Expo development server, allowing you to run the app in your web browser or on a mobile device using the Expo app.

## Components
AmorphousBlob: A React component that renders a 3D blob using Three.js. The blob's shape and appearance change dynamically based on the audio being played.
StarfieldBackground: A React component that creates a starfield effect in the background, enhancing the visualizer's depth and immersion.
## Development
This project was bootstrapped with Expo, and utilizes the following key libraries:

react-three-fiber and @react-three/drei for 3D rendering
expo-av for audio playback and analysis
simplex-noise for generating smooth, natural-looking noise in 3D visualizations
License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or create an issue for bugs, feature requests, or improvements.

