# Anime Companion

Anime Companion is a mobile application built with Expo that serves as a comprehensive tool for anime enthusiasts. The app allows users to explore a wide range of anime titles, manage their watchlists, and connect with other fans. 

## Features

- **User Authentication**: Secure login and registration using Firebase Authentication, including email/password and Google sign-in options.
- **Anime Data Fetching**: Fetches data from the Jikan API to provide users with detailed information about various anime titles.
- **Search Functionality**: Users can search for anime titles using a fuzzy search bar.
- **Profile Management**: Users can view and edit their profile information, including display name and avatar.
- **Home Screen**: Displays a paginated list of anime with options to filter and refresh the list.
- **Responsive Design**: The app is designed to work seamlessly on both iOS and Android devices.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Anime-Companion.git
   ```
2. Navigate to the project directory:
   ```
   cd Anime-Companion
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Set up Firebase:
   - Create a Firebase project and enable Authentication.
   - Update the `src/config/firebase.ts` file with your Firebase configuration.

5. Configure environment variables:
   - The app uses a `.env` file for configuration.
   - Make sure the following variables are set:
     ```
     # For local development (use your computer's IP address for mobile devices)
     EXPO_PUBLIC_LOCAL_API_URL=http://10.0.2.2:3000
     
     # For production or when local server is unavailable
     EXPO_PUBLIC_REMOTE_API_URL=https://your-production-server.com
     ```

6. Start the development server:
   ```
   npm start
   ```

## Usage

- Launch the app on your device or emulator.
- Sign in or create a new account.
- Explore the anime list, search for your favorite titles, and manage your profile.

### Server Connectivity

The app uses a smart server connection system:
1. It first attempts to connect to your local development server (defined by `EXPO_PUBLIC_LOCAL_API_URL`).
2. If the local server is unavailable, it falls back to the remote server (defined by `EXPO_PUBLIC_REMOTE_API_URL`).
3. If neither server is available, the app will display an appropriate error message.

This allows for seamless development and testing while ensuring the app works in production environments.

## Screenshots

Here are some screenshots showcasing the app's interface and features. The Anime Companion app provides a clean, intuitive user experience with a modern UI design that makes it easy to browse, search, and manage your anime collection:

<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center">
  <figure>
    <img src="Screenshot/Screenshot (1).png" alt="Login Screen" width="250"/>
    <figcaption>Login Screen</figcaption>
  </figure>
  <figure>
    <img src="Screenshot/Screenshot (2).png" alt="Home Screen" width="250"/>
    <figcaption>Home Screen with Anime List</figcaption>
  </figure>
  <figure>
    <img src="Screenshot/Screenshot (3).png" alt="Anime Details" width="250"/>
    <figcaption>Anime Details View</figcaption>
  </figure>
  <figure>
    <img src="Screenshot/Screenshot (4).png" alt="Search Screen" width="250"/>
    <figcaption>Search Functionality</figcaption>
  </figure>
  <figure>
    <img src="Screenshot/Screenshot (5).png" alt="Watchlist" width="250"/>
    <figcaption>User Watchlist</figcaption>
  </figure>
  <figure>
    <img src="Screenshot/Screenshot (6).png" alt="Profile Screen" width="250"/>
    <figcaption>User Profile</figcaption>
  </figure>
</div>

<details>
  <summary>More Screenshots</summary>
  <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center">
    <figure>
      <img src="Screenshot/Screenshot (7).png" alt="Signup Screen" width="250"/>
      <figcaption>Signup Screen</figcaption>
    </figure>
    <figure>
      <img src="Screenshot/Screenshot (8).png" alt="Edit Profile" width="250"/>
      <figcaption>Edit Profile Screen</figcaption>
    </figure>
    <figure>
      <img src="Screenshot/Screenshot (9).png" alt="Anime Suggestions" width="250"/>
      <figcaption>Anime Suggestions</figcaption>
    </figure>
    <figure>
      <img src="Screenshot/Screenshot (10).png" alt="About Screen" width="250"/>
      <figcaption>About Screen</figcaption>
    </figure>
    <figure>
      <img src="Screenshot/Screenshot (11).png" alt="Support Screen" width="250"/>
      <figcaption>Support Screen</figcaption>
    </figure>
    <figure>
      <img src="Screenshot/Screenshot (12).png" alt="Notifications" width="250"/>
      <figcaption>Notifications View</figcaption>
    </figure>
  </div>
</details>

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License with Attribution Requirement. This means you are free to use, modify, and distribute the code, but you must give credit to the original authors by including the name "Anime Companion" and a link to the original repository in your project. See the LICENSE file for details.