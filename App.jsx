import { StyleSheet, Text, View, Image, TouchableOpacity, PermissionsAndroid } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-core';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import {bundleResourceIO, decodeJpeg, fetch} from '@tensorflow/tfjs-react-native';
import 'expo-gl';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-converter'
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import * as FileSystem from 'expo-file-system';

const App = () => {

  const createFaceMesh = async (imageURI) => {
    await tf.ready();
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const modelJson = require('./assets/model.json');
    const modelWeights = require('./assets/group1-shard1of1.bin');
    const detectorConfig = {
      runtime: 'tfjs',
      landmarkModelUrl : bundleResourceIO(modelJson, modelWeights)
    };
    let detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
    const estimationConfig = {flipHorizontal: false, staticImageMode: true};

    // const image = require('./assets/abc.jpeg');
    // const imageAssetPath = Image.resolveAssetSource(image);
    // const response = await fetch(imageAssetPath.uri, {}, { isBinary: true });
    // const rawImageData = await response.arrayBuffer();
    // const imageData = new Uint8Array(rawImageData);

    const imgB64 = await FileSystem.readAsStringAsync(imageURI, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
    const raw = new Uint8Array(imgBuffer)  
    const imageTensor = decodeJpeg(raw);

    console.log(imageTensor)
      
    let faceMesh = await detector.estimateFaces( imageTensor, estimationConfig);
    console.log(faceMesh);
  }
  
  const requestCameraPermission = async() => {
    if (Platform.OS === 'android') {
        try {
            const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.CAMERA
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                let options = {
                    storageOptions: {
                    skipBackup: true,
                    path: 'images',
                    },
                    cameraType: 'front'
                };
                launchCamera(options, (response) => {
                    console.log('Response = ', response);
                    createFaceMesh(response.assets[0].uri)
                })
            } else {
                if((granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)){
                    Alert.alert(
                        'Permission Request',
                        'Please allow permission to access the Camera.',
                        [
                        {
                            text: 'Go to Settings',
                            onPress: () => {
                            Linking.openSettings();
                            },
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                        ],
                        { cancelable: false },
                    );
                }
            console.log("Camera permission denied");
            }
        } catch (err) {
            console.warn(err);
        }
    }
  }

  return (
    <View>
        <TouchableOpacity onPress={() => {requestCameraPermission()}}>
          <Text>Open Camera</Text>
        </TouchableOpacity>
    </View>
  )
}

export default App

const styles = StyleSheet.create({})