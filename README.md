# T-Shirt Design Application

A comprehensive web application for creating custom t-shirt designs with AI-powered image generation and advanced text editing capabilities.

## 🚀 Features

### Core Design Tools
- **Advanced Text Editor**: Rich text editing with 200+ fonts, gradients, shadows, and distortions
- **AI Image Generation**: 50+ AI models including Flux, Stable Diffusion, and specialized style models
- **Design Templates**: Pre-built templates with prompt-based generation
- **Shape Elements**: Geometric, abstract, hand-drawn, ink, and grunge shapes
- **Image Editing**: Upload, edit, and manipulate images with filters and effects

### Text Effects & Distortions
- **Mesh Warp**: Advanced text distortion with customizable grid points
- **Grid Distort**: Perspective and dimensional text effects
- **Circular Text**: Curved text along circular paths
- **3D Effects**: Block shadows, perspective shadows, and detailed 3D rendering
- **Decorative Effects**: Horizontal lines, diagonal patterns, color cuts, and fading effects

### Advanced Features
- **Gradient System**: Linear and radial gradients for text and shapes
- **Stroke System**: Independent opacity controls for text and shape outlines
- **Shadow Effects**: Multiple shadow types with blur, offset, and color controls
- **Artboard System**: Precise canvas control with movable corners
- **Copy/Paste/Undo/Redo**: Full editing workflow support

### User Management
- **Authentication**: Secure JWT-based login system
- **User Profiles**: Personal accounts with credit management
- **Collections**: Save and organize designs
- **Inspirations**: AI-generated image library
- **Text Styles**: Save and reuse text formatting

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Fabric.js
- **AI Integration**: Replicate API with 50+ models
- **Image Processing**: Sharp, Canvas API, WebGL
- **Authentication**: JWT with bcrypt
- **File Storage**: Local storage with B2 integration
- **Payment**: Stripe integration for credits

## 📦 Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/tshirts.git
cd tshirts
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the application:**
```bash
npm start
```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# AI Integration
REPLICATE_API_TOKEN=your_replicate_api_token

# Server
PORT=3006
NODE_ENV=development

# Payment (Optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Storage (Optional)
B2_APPLICATION_KEY_ID=your_b2_key_id
B2_APPLICATION_KEY=your_b2_application_key
B2_BUCKET_NAME=your_b2_bucket_name
```

## 🎨 Usage

### Getting Started
1. Navigate to `http://localhost:3006`
2. Register a new account or login
3. Access the design editor from the main dashboard

### Creating Designs
1. **Text Editor**: Add text with advanced formatting options
2. **AI Generation**: Use prompt templates to generate background images
3. **Shape Library**: Add geometric and artistic elements
4. **Effects**: Apply shadows, distortions, and decorative effects
5. **Export**: Save your design as PNG, JPG, or SVG

### Advanced Features
- **Mesh Warp**: Select text and use the Distort tab for advanced warping
- **Gradients**: Apply linear/radial gradients to text and shapes
- **Templates**: Save complete designs as reusable templates
- **Collections**: Organize your work into themed collections

## 📁 Project Structure

```
tshirts/
├── public/                 # Frontend assets
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   ├── fonts/             # Font files (200+ fonts)
│   ├── images/            # UI icons and assets
│   ├── stock/             # Stock images and shapes
│   └── *.html             # HTML pages
├── routes/                # Express routes
├── models/                # MongoDB schemas
├── middleware/            # Custom middleware
├── services/              # Business logic
├── config/                # Configuration files
└── server.js              # Main server file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Design Management
- `GET /api/templates` - Get design templates
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### AI Generation
- `POST /api/generate` - Generate images with AI
- `GET /api/models` - Get available AI models
- `POST /api/inspirations` - Save generated images

### Collections
- `GET /api/collections` - Get user collections
- `POST /api/collections` - Create new collection
- `PUT /api/collections/:id` - Update collection

## 🎯 Key Features Explained

### Mesh Warp System
Advanced text distortion using WebGL shaders and control points for precise text manipulation.

### AI Model Integration
50+ specialized AI models including:
- Flux variants for different styles
- Sticker makers and character creators
- Artistic styles (watercolor, sketch, 3D)
- Background removers and upscalers

### Font System
200+ fonts with proper variant detection:
- Regular, Bold, Italic, Bold Italic variants
- Dynamic font loading from local files
- Font preview in dropdown menus

### Gradient Engine
Advanced gradient system supporting:
- Linear gradients with angle control
- Radial gradients with position control
- Text masking for distorted effects
- Independent compression controls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Fabric.js for canvas manipulation
- Replicate for AI model hosting
- MongoDB for data storage
- All the amazing AI model creators

## 📞 Support

For support, email support@yourapp.com or create an issue in this repository.
