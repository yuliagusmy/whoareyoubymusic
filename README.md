# Who Are You by Music
A web app that describes the user based on the user's Spotify.



https://github.com/user-attachments/assets/9f2ccf9b-c935-40d3-8201-d25034f394f1



 ## Built with
* [ReactJS](https://reactjs.org/)
* [Supabase](https://supabase.com/)
* [SpotifyAPI](https://developer.spotify.com/documentation/web-api)
* [GeminiAPI](https://ai.google.dev/)

## Getting started
1. Install the modules used by running `npm i`
2. Set up SpotifyAPI by creating an app that uses the WebAPI
3. Create Supabase project and enable Spotify provider option
4. Copy and paste Client ID and Secret from SpotifyAPI to Supabase
5. Copy and paste callback URL from Supabase to SpotifyAPI
6. Create a GeminiAPI project
7. Create `.env` file with the following template
```VITE_CLIENT_ID = ec35fae5861a4782a142f85ae2df71e4
VITE_CLIENT_ID=your_spotify_client_id
VITE_CLIENT_SECRET=your_spotify_client_secret

VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_URL=your_supabase_url

VITE_GEMINI_API_KEY=your_gemini_api_key
```
7. Run the development server by running `npm run dev`
