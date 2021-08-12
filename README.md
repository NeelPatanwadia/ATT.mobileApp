# About Time Tours Mobile App

The About Time Tours mobile app is a bare React Native application targeting both Android and iOS. 
## Development Environment

### Requirements

#### Node.js

Node.js 12+ should be sufficient to build and run this application.

#### Yarn

```bash
npm install -g yarn
```

#### Amplify

Currently we are using version 4.41, you may be alright on the latest version, but must be at least up to 4.41.
```bash
npm install -g @aws-amplify/cli@4.41
```

#### Expo

This app runs from an ejected Expo app. Expo is used for push notifications and OTA updates.

```bash
npm install -g expo-cli
```

#### iOS

In order to build and run this application on an iOS device, you must be developing on a Mac. 

##### Xcode 

You should have at least Xcode version 12.2 installed in order to build iOS 14.x applications.

##### CocoaPods

iOS dependencies are managed via the CocoaPods cli tool. 

``` bash
sudo gem install cocoapods
```
#### Android

##### Android Studio 

Android Studio version 4+ can be used to build and run the application for Android devices.

You can download it here:
https://developer.android.com/studio

##### Java

Java version 15 can be downloaded here:
https://www.oracle.com/java/technologies/javase-downloads.html


#### ESLint

This project makes use of ESLint to enforce common coding patterns. Please make sure your vscode (or editor of choice) is configured to automatically format your code. See here for addtional instructions:

https://github.com/FiveTalent/eslint-config-fivetalent

### Installation

#### Clone Repo

```bash
git clone git@github.com:FiveTalent/abouttimetours.mobileapp.git
cd abouttimetours.mobileapp
```

#### Install Dependancies

```bash
yarn install
```

#### Database Initialization

Ensure your lead developer has set up your database schema for you prior to configuring your amplify environment.

#### Configure Amplify

If you do not already have credentials for the About Time Tours AWS Account, ask your lead developer for help getting access.

```bash
amplify init
? Do you want to use an existing environment? No
? Enter a name for the environment <YOUR_ENV_NAME> // generally <firstname>dev
Using default provider  awscloudformation

For more information on AWS Profiles, see:
https://docs.aws.amazon.com/cli/latest/userguide/cli-multiple-profiles.html

? Do you want to use an AWS profile? Yes
? Please choose the profile you want to use <YOUR_PROFILE_FOR_ABOUT_TIME_TOURS>
....
....
✔ Successfully created initial AWS cloud resources for deployments.
? Provide the region in which your cluster is located:
> us-west-2
? Select the Aurora Serverless cluster that will be used as the data source for your API:
> database-dev
? Select the database to use as the datasource:
> <YOUR_ENV_NAME> // this will need to be created
? Do you want to configure Lambda Triggers for Cognito? No

Initialized your environment successfully.

Your project has been successfully initialized and connected to the cloud!
```

There are some dependancies that need to be cleaned up. In the meantime, in order to do your first amplify push, you must delete the CustomResources.json file here:

```
amplify/backaend/api/abouttimetours/stacks/CustomResources.json
```

Then run:

``` bash
amplify status
```

You should see a list of all of the resources associated with the environment in a "Create" state. Push those resouces to the cloud by running:

``` bash
amplify push -y
```

Finally, restore your CustomResources.json file and push again.

``` bash
amplify push -y
```

#### Deploy additional backend resources

Make sure to deploy the microservices found in the abouttimetours.services repo here:
https://github.com/FiveTalent/abouttimetours.services

#### Set up an environment config

See the configs folder in the root level of the project. Create a new file in this folder called config.<YOUR_ENV_NAME>.js and copy the contents of config.example.js into this file. Update the values as needed for your environment.

Some of these values rely on the resources created in the abouttimetours.services deployment.

* notificationEndpoint => push-notification-service
* publicService => public-service

#### Load your config

Once your environment config is set up, you'll want to run the command

```bash
./prepareEnv.sh --stage <YOUR_ENV>
```

before you start your app. This will swap out the config.js file with the copy specific to your environment.

#### Expo Notification Configuration

This application leverages Expo Push Notifications. In order for Expo to send notifications to your device, you must upload credentials to your Expo account. 

```bash
expo credentials:manager
```

See here for more details:
https://github.com/expo/expo/tree/master/packages/expo-notifications#add-your-projects-credentials-to-expo-server-optional

If you do not have access to the Apple Developer or Firebase accounts, ask your lead developer for additional set up instructions.

**In order to receive push notifications, you must run the application on a physical device.**
### Running the App
#### Running on iOS

Make sure your iOS dependancies are installed by changing to the ios directory and running a pod install before running the application.

``` bash
cd ios
pod install

cd ..
yarn start
```

If you want to install/run the application on a physical device, you'll need to have your device added to the Apple Developer Certificate device list.

Then run:

```bash
react-native run-ios --device "<YOUR_DEVICE_NAME>"
```

Alternatively, you can simply select your device as the build target within Xcode and press the play button.

#### Running on Android

To run on the application on an Android device, connect your Android and enable developer options and USB debugging. See here for more information:

https://developer.android.com/studio/debug/dev-options

In order to run a debug build, you must have a debug.keystore file in your app/android directory. If one is not there, run the command:

```bash
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android

```

Once connected run 
```bash 
yarn android
```


This will install the application to your connected android device (or a running emulator in Android Studio)

By default, the application will not know where to look for the metro bundle. Launch the app and shake your phone to bring up the React Native developer options. 

Dev Settings → Debug server host & port for device.

Enter your local ip followed by :8081, eg. 10.0.1.10:8081

Restart the application and you should see the JavaScript bundle being installed.

### In App Subscriptions

This application makes use of in-app subscriptions via the App Store / Google Play Store. In order to make purchases on Android, your account must be whitelisted for free payments. On iOS, you can use a sandbox account or your real account to make simulated purchases.

**You must use a physical device in order to connect to the App Store/Google Play Store.**

Subscriptions can simply be disabled by changing the setting
`Subscriptions.SubscriptionsRequired` to false in your Aurora Database.