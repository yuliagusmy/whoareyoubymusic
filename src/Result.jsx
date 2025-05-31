import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import supabase from './supabaseClient'


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

    const navigate = useNavigate()

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    const getResponse = async () => {
        setResponseLoading(true)
        try {
            const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `User's top artists are ${topArtists.map(artist => artist.name).join(', ')} and top tracks are ${topTracks.map(track => track.name + '-' + track.artists[0].name).join(', ')}.`,
            config: {
                systemInstruction: `# Role
                You are a personality analyzer that uses a person's top artists, top tracks, and top genres to decide what the person is like.

                # Instructions
                1. You will be given the user's top artists and top tracks from their Spotify
                2. Create a description of their personality in a fun gen z/gen alpha way. Example phrases: 
                - huzz: girlfriend/boyfriend - find yourself a huzz! (find yourself a partner)
                - oh who is you: oh who are you
                - get outta here: get out of here
                - what the hell brother: what in the world
                You dont need to use all of these phrases, but use them in a way that makes sense. Please research your own phrases, don't always use the ones I provided.

                # Rules
                1. Do not use text formatting like bold and italics.
                2. You don't need to write a particular sentence for each song or artist. However, do analyze the whole personality based on all songs and artists. Keep it a maximum of two paragraphs but each paragraph at least 5 complete sentences. Don't make the paragraphs too short. 
                Remember, you are giving an in-depth analysis of the person's personality based on their Spotify data.

                # Output
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
                Dawg, hello are you good? Why have you been listening to undressed and i wanna be yours lately. Are you not over someone? Or do you just like that feeling of being hurt? You really need a huzz, man.

                Listening to the Marias and Sombr at the same time is honestly depressing. Call your friends, genuinely. Arctic Monkeys in that list makes you quite the rockstar, though. You're probably a social person that gets exhausted easily based on your music taste. The fact that you listen to Love me not really adds to the fact that you get exhausted easily—you probably are that bed rotten person who only scrolls TikTok and talk energetically when its only the start of the conversation.`
        }})
        setResponse(response.text)
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

            console.log('Current session:', currentSession)
            console.log('Provider token exists:', !!currentSession.provider_token)

            const accessToken = currentSession.provider_token
            
            if (!accessToken) {
                console.error('No provider_token found in session')
                setError('No Spotify access token found')
                return []
            }

            console.log('Making Spotify API call for top artists...')

            const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=5&time_range=medium_term', {
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
            console.log('Top artists data:', data)
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
            
            // Get fresh session data
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

            console.log('Making Spotify API call for top tracks...')

            const response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term', {
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
            console.log('Top tracks data:', data)
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
        if (!loading && session && session.provider_token && topArtists.length === 0) {
            console.log('Auto-fetching top artists and tracks...')
            getTopArtists().then(artists => {
                setTopArtists(artists)
            })
            getTopTracks().then(tracks => {
                setTopTracks(tracks)
            })
        }
    }, [loading, session])


    useEffect(() => {
        if (topArtists.length > 0 && topTracks.length > 0 && !artistsLoading && !tracksLoading) {
            setDataLoaded(true)
        }
    }, [topArtists, topTracks, artistsLoading, tracksLoading])

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
        <div className='header result-bg flex flex-col items-center justify-center min-h-screen p-10'>
            <div className='max-w-4xl text-center'>
                <h1 className='font-bold text-2xl mb-4'>
                    {user?.name || user?.display_name}, here's your result
                </h1>
                
                <div className="description mb-8 px-10 text-sm text-left space-y-4">
                    {responseLoading ? (
                        <div className="text-center">
                            <div className="animate-pulse">Generating your description...</div>
                        </div>
                    ) : response ? (
                        displayText.split('\n\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))
                    ) : null}
                </div>
            </div>
            
            <div className="flex flex-col items-start gap-12">
                <div className="flex items-start gap-6">
                    {topArtists[0]?.images?.length > 0 && (
                        <img
                            src={topArtists[0].images[0].url}
                            className="w-40 h-40 object-cover"
                            alt="Top artist"
                        />
                    )}
                    <div>
                        <h1 className="font-bold text-xl mb-2">Current Top Artists</h1>
                        <ol className="text-left text-sm space-y-1">
                            {topArtists.map((artist, i) => (
                                <li key={artist.id || i} className="flex">
                                    <span className="w-6 font-medium">{i + 1}.</span>
                                    <span>{artist.name}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                <div className="flex items-start gap-6">
                    {topTracks[0]?.album?.images?.length > 0 && (
                        <img
                            src={topTracks[0].album.images[0].url}
                            className="w-40 h-40 object-cover"
                            alt="Top track"
                        />
                    )}
                    <div>
                        <h1 className="font-bold text-xl mb-2">Current Top Tracks</h1>
                        <ol className="text-left text-sm space-y-1">
                            {topTracks.map((track, i) => (
                                <li key={track.id || i} className="flex">
                                    <span className="w-6 font-medium">{i + 1}.</span>
                                    <span>{track.name}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                <button
                    onClick={LogOut}
                    className='mt-6 text-sm font-bold border-2 border-white rounded-full px-3 py-2 hover:bg-white hover:text-black transition-colors'
                >
                    Log Out
                </button>
            </div>
        </div>
    )
}

export default Result