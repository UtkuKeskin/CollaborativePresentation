# Collaborative Presentation Software

Real-time collaborative presentation software built with .NET Core and React.

## 🚀 Features

- **No Registration Required** - Users can join with just a nickname
- **Real-time Collaboration** - Multiple users can edit presentations simultaneously
- **Role-based Access Control** - Creator, Editor, and Viewer roles
- **Markdown Support** - Rich text editing with markdown formatting
- **Presentation Mode** - Full-screen presentation capabilities
- **Persistent Storage** - All changes are saved automatically

### Optional Features (Implemented)
- [x] Delete elements functionality
- [x] Multiple shapes (rectangle, circle, arrow) with colors
- [ ] Image support
- [ ] Zoom in/out functionality
- [ ] Thumbnail preview in presentation list
- [ ] Animations and transitions
- [x] Export to PDF

## 🛠️ Technology Stack

### Backend
- ASP.NET Core 8.0
- Entity Framework Core
- SignalR
- PostgreSQL
- QuestPDF for PDF generation

### Frontend
- React 19 with TypeScript
- Redux Toolkit
- Konva.js for canvas manipulation
- SignalR client
- Tailwind CSS

## 📋 Prerequisites

- .NET 8.0 SDK
- Node.js 18+ and npm
- PostgreSQL
- Docker (optional)

## 🏃‍♂️ Getting Started

### Clone the repository
```bash
git clone https://github.com/yourusername/CollaborativePresentation.git
cd CollaborativePresentation
```

### Backend Setup
```bash
cd src/CollaborativePresentation.API
dotnet restore
dotnet ef database update
dotnet run
```

### Frontend Setup
```bash
cd src/collaborative-presentation-client
npm install
npm start
```

### Using Docker
```bash
docker-compose up -d
```

## 📁 Project Structure

```
CollaborativePresentation/
├── src/
│   ├── CollaborativePresentation.API/       # Web API project
│   ├── CollaborativePresentation.Core/      # Domain entities and interfaces
│   ├── CollaborativePresentation.Infrastructure/  # Data access and services
│   └── collaborative-presentation-client/    # React frontend
├── tests/                                    # Test projects
├── deployment/                               # Deployment configurations
└── docker-compose.yml                        # Docker configuration
```

## 🔧 Configuration

### Connection String
Update the connection string in `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=CollaborativePresentationDb;Username=postgres;Password=postgres123"
  }
}
```

### Environment Variables
Create `.env` file in the client directory:
```
REACT_APP_API_URL=http://localhost:5167
REACT_APP_SIGNALR_URL=http://localhost:5167/presentationHub
```

## 🎨 Key Features Implementation

### Shape Tools
- Rectangle, Circle, and Arrow drawing tools
- Color picker for customizing shapes
- Drag and drop functionality
- Resize and delete operations

### PDF Export
- Export presentations to PDF format
- Preserves text content and shape information
- Download directly from the toolbar

### Real-time Collaboration
- WebSocket-based real-time updates
- User presence indicators
- Role-based permissions

## 🧪 Testing

### Run Backend Tests
```bash
cd tests/CollaborativePresentation.API.Tests
dotnet test
```

### Run Frontend Tests
```bash
cd src/collaborative-presentation-client
npm test
```

## 📦 Deployment

### Build for Production
```bash
# Backend
dotnet publish -c Release -o ./publish

# Frontend
npm run build
```

### Deploy to Azure/AWS/Heroku
See deployment guide in `/deployment/README.md`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is created for educational purposes as part of Itransition internship program.

## 👤 Author

**Tayyar Utku Keskin**
- GitHub: [@UtkuKeskin](https://github.com/yourusername/CollaborativePresentation)
- Email: tayyarutkukeskin@gmail.com

## 🙏 Acknowledgments

- Built as Task #6 for .NET internship program
- Itransition Intern Developer Training

---