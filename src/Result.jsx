import { GoogleGenAI } from "@google/genai";
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './supabaseClient';


const Result = () => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState(null)
    const [topArtists, setTopArtists] = useState([])
    const [topTracks, setTopTracks] = useState([])
    const [artistsLoading, setArtistsLoading] = useState(false)
    const [tracksLoading, setTracksLoading] = useState(false)
    const [error, setError] = useState(null)
    const [response, setResponse] = useState(null)
    const [responseLoading, setResponseLoading] = useState(false)
    const [hasFetchedResponse, setHasFetchedResponse] = useState(false)
    const [displayText, setDisplayText] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [dataLoaded, setDataLoaded] = useState(false)
    const [topGenres, setTopGenres] = useState([])
    const [topTrackAudioFeatures, setTopTrackAudioFeatures] = useState([])
    const [selectedTimeRange, setSelectedTimeRange] = useState('short_term')
    const [quickSummary, setQuickSummary] = useState('')
    const [showDetailedSummary, setShowDetailedSummary] = useState(false)

    const navigate = useNavigate()

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    const getResponse = async () => {
        setResponseLoading(true)
        try {
            const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `User's top artists are ${topArtists.map(artist => artist.name).join(', ')}, with genres like ${[...new Set(topArtists.flatMap(artist => artist.genres))].join(', ')}. Their top tracks are ${topTracks.map(track => track.name + '-' + track.artists[0].name).join(', ')}. The audio features for these tracks include average danceability: ${topTrackAudioFeatures.reduce((sum, f) => sum + f.danceability, 0) / topTrackAudioFeatures.length || 0}, energy: ${topTrackAudioFeatures.reduce((sum, f) => sum + f.energy, 0) / topTrackAudioFeatures.length || 0}, and valence: ${topTrackAudioFeatures.reduce((sum, f) => sum + f.valence, 0) / topTrackAudioFeatures.length || 0}.`,
            config: {
                systemInstruction: `# Role
                You are a personality analyzer that uses a person's top artists, top tracks, top genres, and audio features (danceability, energy, valence) to decide what the person is like.

                # Instructions
                1. You will be given the user's top artists, top tracks, top genres, and average audio features from their Spotify.
                2. Create a description of their personality in a fun gen z/gen alpha way. Example phrases:
                - huzz: girlfriend/boyfriend - find yourself a huzz! (find yourself a partner)
                - oh who is you: oh who are you
                - get outta here: get out of here
                - what the hell brother: what in the world
                You dont need to use all of these phrases, but use them in a way that makes sense. Please research your own phrases, don't always use the ones I provided.
                3. Incorporate insights from genres and average audio features to give a more nuanced personality analysis. For example, high danceability might suggest an outgoing personality, while low energy might suggest a more introspective one. Focus on interpreting the music data into personality traits.

                # Rules
                1. Do not use text formatting like bold and italics.
                2. You don't need to write a particular sentence for each song, artist, or genre. However, do analyze the whole personality based on all songs, artists, genres, and audio features. Keep it a maximum of two paragraphs but each paragraph at least 5 complete sentences. Don't make the paragraphs too short.
                Remember, you are giving an in-depth analysis of the person's personality based on their Spotify data.

                # Output
                First, provide a quick summary of the personality in one sentence, prefixed with "SUMMARY: ". Then, continue with the full description as previously defined.
                The description of the person. You can joke around, be a little prick by calling them a sad person or something. It's all fun, but it must be accurate and all based from their Spotify data. Make sure the output is a well written paragraph, not fragmented, but don't make it too formal.

                Just dive into the description. Don't start with sentences like "Ah, diving into your Spotify to find out what makes you, you. Let's see what we've got here." or similar ones.

                Do not output recommendations to other singers like "So, are you sad? Or are you just eclectic? Either way, get outta here with your cool music taste, and don't forget to add some JPEGMafia to balance out everything. Huzz!" or similar ones.

                # Example Outputs

                Example 1:
                One of the inputs: Sombr
                A part of the output: Why are you listening to Sombr? You're probably sad. Oh, who hurt you. I feel bad.

                Example 2:
                One of the inputs: Back to Me - The Marias
                A part of the output: Did you just get over someone or are you just enjoying the beauty of Back to Me? Perhaps, you're someone who's very melancholic. But man, go get your huzz.

                Example 3:
                One of the inputs: JPEGMafia
                A part of the output: Oh, JPEGMafia is underrated. Are you trying to be cool or something?

                Example 4:
                Input:
                Top Artists - Ravyn Lenae, Arctic Monkeys, Sombr, The Marias, Cigarettes After Sex

                Top Songs - Love Me Not by Ravyn Lenar, Starry Eyes by Cigarettes After Sex, Apocalypse by Cigarettes After Sex, Undressed by Sombr, I Wanna be Yours by Arctic Monkeys

                Output:
                SUMMARY: You're likely a deeply emotional and introspective individual with a rockstar edge, often seeking solace in music.
                Dawg, hello are you good? Why have you been listening to undressed and i wanna be yours lately. Are you not over someone? Or do you just like that feeling of being hurt? You really need a huzz, man.

                Listening to the Marias and Sombr at the same time is honestly depressing. Call your friends, genuinely. Arctic Monkeys in that list makes you quite the rockstar, though. You're probably a social person that gets exhausted easily based on your music taste. The fact that you listen to Love me not really adds to the fact that you get exhausted easily—you probably are that bed rotten person who only scrolls TikTok and talk energetically when its only the start of the conversation.`
        }})
            const fullResponse = response.text;
            const summaryMatch = fullResponse.match(/^SUMMARY: (.+?)\n/);
            if (summaryMatch && summaryMatch[1]) {
                setQuickSummary(summaryMatch[1]);
                setResponse(fullResponse.replace(/^SUMMARY: (.+?)\n/, '').trim());
            } else {
                setQuickSummary('');
                setResponse(fullResponse);
            }
        }catch (error) {
            console.error('Error generating response:', error)
        }finally{
        setResponseLoading(false)
    }}

    useEffect(() => {
        if (response && !responseLoading) {
            setDisplayText('')
            setIsTyping(true)

            const timer = setTimeout(() => {
                let charIndex = 0
                const fullText = response

                const typeCharacter = () => {
                    if (charIndex < fullText.length) {
                        setDisplayText(fullText.substring(0, charIndex + 1))
                        charIndex++
                        setTimeout(typeCharacter, 30)
                    } else {
                        setIsTyping(false)
                    }
                }

                typeCharacter()
            }, 500)

            return () => clearTimeout(timer)
        }
    }, [response, responseLoading])

    const getTopArtists = async () => {
        try {
            setArtistsLoading(true)
            setError(null)

            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) {
                console.error('Session error:', sessionError)
                setError('Session error')
                return []
            }

            if (!currentSession) {
                console.error('No session found')
                setError('No session found')
                return []
            }


            const accessToken = currentSession.provider_token

            if (!accessToken) {
                console.error('No provider_token found in session')
                setError('No Spotify access token found')
                return []
            }

            const response = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=5&time_range=${selectedTimeRange}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Spotify API error:', response.status, errorText)

                if (response.status === 429) {
                    setError('Rate limit exceeded. Please wait a moment and try again.')
                    return []
                }

                if (response.status === 401) {
                    setError('Access token expired. Please log in again.')
                    return []
                }

                if (response.status === 403) {
                    setError('Insufficient permissions. Please check your Spotify app scopes include "user-top-read".')
                    return []
                }

                setError(`Spotify API error: ${response.status}`)
                return []
            }

            const data = await response.json()
            const genres = data.items.flatMap(artist => artist.genres);
            setTopGenres([...new Set(genres)]);
            return data.items || []

        } catch (err) {
            console.error('Error fetching top artists:', err)
            setError('Failed to fetch top artists')
            return []
        } finally {
            setArtistsLoading(false)
        }
    }

    const getTopTracks = async () => {
        try {
            setTracksLoading(true)
            setError(null)

            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError) {
                console.error('Session error:', sessionError)
                setError('Session error')
                return []
            }

            if (!currentSession) {
                console.error('No session found')
                setError('No session found')
                return []
            }

            const accessToken = currentSession.provider_token

            if (!accessToken) {
                console.error('No provider_token found in session')
                setError('No Spotify access token found')
                return []
            }


            const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=${selectedTimeRange}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Spotify API error:', response.status, errorText)

                if (response.status === 429) {
                    setError('Rate limit exceeded.')
                    return []
                }

                if (response.status === 401) {
                    setError('Access token expired. Please log in again.')
                    return []
                }

                if (response.status === 403) {
                    setError('Insufficient permissions.')
                    return []
                }

                setError(`Spotify API error: ${response.status}`)
                return []
            }

            const data = await response.json()
            console.log('Top tracks data:', data)
            const trackIds = data.items.map(track => track.id).join(',');
            if (trackIds) {
                const audioFeaturesResponse = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (audioFeaturesResponse.ok) {
                    const audioFeaturesData = await audioFeaturesResponse.json();
                    setTopTrackAudioFeatures(audioFeaturesData.audio_features);
                } else {
                    console.error('Error fetching audio features:', audioFeaturesResponse.status, await audioFeaturesResponse.text());
                }
            }

            return data.items || []

        } catch (err) {
            console.error('Error fetching top tracks:', err)
            setError('Failed to fetch top tracks')
            return []
        } finally {
            setTracksLoading(false)
        }
    }

    const LogOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error('Logout error:', error)
            }

            navigate('/')
            await supabase.auth.setSession(null)
        } catch (err) {
            console.error('Error during logout:', err)
        }
    }

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                localStorage.clear()
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        let mounted = true

        const getSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('Session error:', error)
                    return
                }

                console.log('Session data:', session)

                if (mounted) {
                    setUser(session?.user?.user_metadata || null)
                    setSession(session)
                    setLoading(false)
                }
            } catch (error) {
                console.error('Error getting session:', error)
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        getSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log('Auth state changed:', event, session?.user?.user_metadata)
                if (mounted) {
                    setUser(session?.user?.user_metadata || null)
                    setSession(session)
                    setLoading(false)
                }
            }
        )

        return () => {
            mounted = false
            subscription?.unsubscribe()
        }
    }, [])

    useEffect(() => {
        if (!loading && session && session.provider_token) {
            console.log(`Auto-fetching top artists and tracks for ${selectedTimeRange}...`)
            // Clear previous data when time range changes or on initial load
            setTopArtists([])
            setTopTracks([])
            setTopGenres([])
            setTopTrackAudioFeatures([])
            setHasFetchedResponse(false)

            getTopArtists().then(artists => {
                setTopArtists(artists)
            })
            getTopTracks().then(tracks => {
                setTopTracks(tracks)
            })
        }
    }, [loading, session, selectedTimeRange])


    useEffect(() => {
        if (topArtists.length > 0 && topTracks.length > 0 && !artistsLoading && !tracksLoading && !responseLoading) {
            setDataLoaded(true)
        }
    }, [topArtists, topTracks, artistsLoading, tracksLoading, responseLoading])

    useEffect(() => {
        if (!hasFetchedResponse && topArtists.length > 0 && topTracks.length > 0) {
            setHasFetchedResponse(true)
            getResponse()
        }
    }, [topArtists, topTracks, hasFetchedResponse])


    if (loading || !dataLoaded) {
        return (
            <div className='header result-bg flex flex-col items-center justify-center min-h-screen p-10'>
                <div className='text-center'>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <h2 className='text-xl font-bold mb-2'>Analyzing your music taste...</h2>
                    <p className='text-sm opacity-80'>
                        {loading ? 'Getting your session ready...' :
                         artistsLoading || tracksLoading ? 'Fetching your Spotify data...' :
                         'Almost done...'}
                    </p>
                </div>
            </div>
        )
    }


    if (error) {
        return (
            <div className='header result-bg flex flex-col items-center justify-center min-h-screen p-10'>
                <div className='text-center'>
                    <h2 className='text-xl font-bold mb-2'>Oops! Something went wrong</h2>
                    <p className='text-sm mb-4'>{error}</p>
                    <button
                        onClick={LogOut}
                        className='text-sm font-bold border-2 border-white rounded-full px-4 py-2 hover:bg-white hover:text-black transition-colors'
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }


    return (
        <div className='header result-bg flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 md:p-10'>
            <div className='max-w-4xl w-full text-center p-6 sm:p-8 md:p-10 bg-gray-900 bg-opacity-80 rounded-lg shadow-2xl border border-gray-700'>
                <h1 className='font-bold text-2xl mb-2 text-center text-white md:text-3xl'>
                    {user?.name || user?.display_name}, here's your result
                </h1>
                {quickSummary && (
                    <p className="text-lg font-semibold text-center mb-6 text-purple-300 md:text-xl">{quickSummary}</p>
                )}

                <div className="w-full flex justify-center mt-4 mb-8">
                    <select
                        value={selectedTimeRange}
                        onChange={(e) => setSelectedTimeRange(e.target.value)}
                        className="bg-gray-800 bg-opacity-70 text-white p-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="short_term">Last Month</option>
                        <option value="medium_term">Last 6 Months</option>
                        <option value="long_term">Last Year</option>
                        <option value="long_term">All Time</option>
                    </select>
                </div>

                {response && (
                    <div className="flex flex-col items-center justify-center">
                        <button
                            onClick={() => setShowDetailedSummary(!showDetailedSummary)}
                            className="text-sm font-bold border-2 border-purple-500 rounded-full px-4 py-2 text-purple-300 hover:bg-purple-500 hover:text-white transition-colors mb-4"
                        >
                            {showDetailedSummary ? 'Hide Full Analysis' : 'Show Full Analysis'}
                        </button>

                        {showDetailedSummary && (
                            <div className="description px-4 text-sm text-left space-y-4 min-h-[200px] md:px-10 text-white opacity-90 leading-relaxed">
                                {responseLoading ? (
                                    <div className="text-center">
                                        <div className="animate-pulse">Generating your description...</div>
                                    </div>
                                ) : (
                                    displayText.split('\n\n').map((paragraph, index) => (
                                        <p key={index}>{paragraph}</p>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <div className="flex flex-col items-center p-6 bg-gray-800 bg-opacity-60 rounded-lg shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
                        {topArtists[0]?.images?.length > 0 && (
                            <img
                                src={topArtists[0].images[0].url}
                                className="w-32 h-32 object-cover rounded-lg shadow-md flex-shrink-0"
                                alt="Top artist"
                            />
                        )}
                        <div className="w-full">
                            <h1 className="font-bold text-xl mb-2 text-white">Current Top Artists</h1>
                            <ol className="text-left text-sm space-y-2 text-white opacity-90">
                                {topArtists.map((artist, i) => (
                                    <li key={artist.id || i} className="flex items-baseline">
                                        <span className="w-6 font-medium">{i + 1}.</span>
                                        <span>{artist.name}</span>
                                    </li>
                                ))}
                            </ol>
                            {topGenres.length > 0 && (
                                <div className="mt-2 text-xs opacity-70">
                                    <span className="font-bold">Genres:</span> {topGenres.join(', ')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center p-6 bg-gray-800 bg-opacity-60 rounded-lg shadow-xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
                        {topTracks[0]?.album?.images?.length > 0 && (
                            <img
                                src={topTracks[0].album.images[0].url}
                                className="w-32 h-32 object-cover rounded-lg shadow-md flex-shrink-0"
                                alt="Top track"
                            />
                        )}
                        <div className="w-full">
                            <h1 className="font-bold text-xl mb-2 text-white">Current Top Tracks</h1>
                            <ol className="text-left text-sm space-y-2 text-white opacity-90">
                                {topTracks.map((track, i) => (
                                    <li key={track.id || i} className="flex items-baseline">
                                        <span className="w-6 font-medium">{i + 1}.</span>
                                        <span>{track.name}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center p-6 bg-gray-800 bg-opacity-60 rounded-lg shadow-xl">
                    <h1 className="font-bold text-xl mb-4 text-white">Audio Insights</h1>
                    <div className="w-full text-left text-sm space-y-2 text-white opacity-90">
                        <p>Danceability: { (topTrackAudioFeatures.reduce((sum, f) => sum + f.danceability, 0) / topTrackAudioFeatures.length * 100 || 0).toFixed(0) }%</p>
                        <p>Energy: { (topTrackAudioFeatures.reduce((sum, f) => sum + f.energy, 0) / topTrackAudioFeatures.length * 100 || 0).toFixed(0) }%</p>
                        <p>Valence: { (topTrackAudioFeatures.reduce((sum, f) => sum + f.valence, 0) / topTrackAudioFeatures.length * 100 || 0).toFixed(0) }%</p>
                        <p className="text-xs mt-2 opacity-70">Danceability reflects how suitable a track is for dancing. Energy represents intensity and activity. Valence describes the musical positiveness (e.g., happy, cheerful) conveyed by a track.</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mt-6">
                <button
                    onClick={LogOut}
                    className='text-sm font-bold border-2 border-white rounded-full px-4 py-2 hover:bg-white hover:text-black transition-colors transform hover:scale-105'
                >
                    Log Out
                </button>
            </div>
        </div>
    )
}

export default Result
