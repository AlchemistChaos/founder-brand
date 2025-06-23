# YouTube to Twitter Thread & AI Art Generator

A fully client-side Next.js application that transforms YouTube videos, web articles, PDFs, or text into engaging Twitter threads and Midjourney-style art prompts.

## Features

- 🎥 **YouTube Video Processing**: Extract transcripts from YouTube videos
- 📰 **Article Extraction**: Parse web articles and extract clean content
- 📄 **PDF Processing**: Extract text from uploaded PDF files
- 📝 **Raw Text Processing**: Direct text input support
- 🧵 **Twitter Thread Generation**: Create 8-12 tweet threads with GPT-4
- 🎨 **AI Art Prompts**: Generate 2-3 Midjourney-style prompts
- 🎯 **10 Thread Types**: Summary, Listicle, Myth-busting, Inspirational, and more
- 🧠 **Personal Context**: Inject personal information for customized threads
- 📋 **One-Click Copy**: Easy copying of threads and prompts
- 🌙 **Dark Mode**: Automatic dark/light theme support

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with:

```env
# OpenAI API Key (required)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Database Setup

1. Create a new Supabase project
2. Run the SQL commands in `src/lib/database.sql` to create the required tables
3. The app uses Row Level Security with public access (no authentication required)

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the application.

## Usage

1. **Input Content**: Paste a YouTube URL, article link, upload a PDF, or enter raw text
2. **Select Thread Type**: Choose from 10 different thread formats
3. **Personal Context**: Optionally enable personal context injection
4. **Generate**: Click to create threads and art prompts
5. **Copy**: Use one-click copy buttons for easy sharing

## Thread Types

- **📄 Summary**: Key points overview
- **📝 Listicle**: Numbered insights
- **🔍 Myth-busting**: Debunk misconceptions
- **✨ Inspirational**: Motivational takeaways
- **📖 Narrative**: Story-driven thread
- **❓ Q&A**: Question & answer format
- **🔥 Hot Take**: Controversial opinion
- **🔬 Analysis**: Deep dive teardown
- **💡 Ideas**: Creative concepts
- **🎯 Curated**: Best insights compilation

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS v4
- **AI**: OpenAI GPT-4 API
- **Database**: Supabase
- **PDF Processing**: pdfjs-dist
- **Article Extraction**: Cheerio
- **YouTube**: youtube-transcript
- **Deployment**: Vercel-ready

## API Endpoints

- `POST /api/generate` - Generate threads and art prompts
- `GET /api/proxy` - CORS proxy for article fetching

## Cost Estimates

- **OpenAI API**: ~$0.02-0.10 per generation (depending on content length)
- **Supabase**: Free tier supports up to 50,000 rows
- **Vercel**: Free tier includes 100GB bandwidth

Monthly cost: ~$15-25 with moderate usage.

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically

### Manual Deployment

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.