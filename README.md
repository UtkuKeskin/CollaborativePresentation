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
- [ ] Delete elements functionality
- [ ] Multiple shapes (rectangle, circle, arrow) with colors
- [ ] Image support
- [ ] Zoom in/out functionality
- [ ] Thumbnail preview in presentation list
- [ ] Animations and transitions
- [ ] Export to PDF

## 🛠️ Technology Stack

### Backend
- ASP.NET Core 8.0
- Entity Framework Core
- SignalR
- PostgreSQL/SQL Server

### Frontend
- React with TypeScript
- Redux Toolkit
- Konva.js for canvas manipulation
- SignalR client
- Tailwind CSS

## 📋 Prerequisites

- .NET 8.0 SDK
- Node.js 18+ and npm
- PostgreSQL or SQL Server
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
cd src/CollaborativePresentation.Client
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
│   └── CollaborativePresentation.Client/    # React frontend
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
    "DefaultConnection": "Your connection string here"
  }
}
```

### Environment Variables
Create `.env` file in the client directory:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SIGNALR_URL=http://localhost:5000/presentationHub
```

## 🧪 Testing

### Run Backend Tests
```bash
cd tests/CollaborativePresentation.API.Tests
dotnet test
```

### Run Frontend Tests
```bash
cd src/CollaborativePresentation.Client
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
- GitHub: [@UtkuKeskin](https://github.com/UtkuKeskin/CollaborativePresentation)
- Email: tayyarutkukeskin@gmail.com

## 🙏 Acknowledgments

- Built as Task #6 for .NET internship program

---