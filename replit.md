# Grana Money IA

## Overview

Grana Money IA is a conversational AI financial assistant application. The system provides an interactive chat interface where users can receive financial guidance and advice through natural language conversations. Built as a simple Express.js web application, it features a real-time chat interface with OpenAI GPT integration for intelligent financial assistance in Portuguese.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Single-Page Application Approach**
- **Solution**: Server-rendered HTML with embedded CSS and JavaScript served directly from the Express backend
- **Rationale**: Simplifies deployment and reduces complexity for a minimal-viable-product chatbot interface
- **Trade-offs**: Limited scalability for complex UI interactions; suitable for simple conversational interfaces

**UI Design Pattern**
- Dark theme interface (`#0d1117` background) optimized for extended reading sessions
- Responsive design with viewport meta tags for mobile compatibility
- Inline styles for rapid prototyping without build tooling

### Backend Architecture

**Framework Selection**
- **Solution**: Express.js v5.1.0 with ES6 module syntax
- **Rationale**: Lightweight, widely-adopted Node.js framework with minimal boilerplate
- **Key Features**: 
  - Body parser middleware for JSON request handling
  - RESTful endpoint structure for chat interactions

**Conversation Management**
- **Solution**: In-memory Map-based conversation storage
- **Current Limitation**: Data persistence is session-based only; conversations are lost on server restart
- **Architecture Decision**: Prioritizes simplicity over durability for MVP stage
- **Future Consideration**: This design anticipates migration to persistent storage (database) as the application scales

**AI Integration Pattern**
- **Solution**: Direct OpenAI API integration using official SDK (v6.8.0)
- **Rationale**: Provides enterprise-grade natural language processing capabilities without building custom ML infrastructure
- **Implementation**: Stateless API calls with conversation context managed server-side

### Data Storage

**Current State**: Ephemeral in-memory storage using JavaScript Map
- Conversation histories stored with user/session identifiers as keys
- No database layer implemented in current version

**Architectural Implications**:
- Suitable for development and low-traffic scenarios
- Scalability requires migration to persistent storage (e.g., PostgreSQL, MongoDB)
- Session management currently relies on implicit user identification

### Authentication and Authorization

**Current Implementation**: No authentication layer
- Open access to chat interface
- No user identity management
- API key security handled via environment variables

**Security Considerations**:
- OpenAI API key stored as environment variable (`OPENAI_API_KEY`)
- No rate limiting or abuse prevention mechanisms
- Future enhancement needed for production deployment

## External Dependencies

### Third-Party Services

**OpenAI API**
- **Purpose**: Core AI conversation engine
- **Integration**: Official OpenAI Node.js SDK v6.8.0
- **Authentication**: API key-based authentication via environment variables
- **Usage**: Powers all conversational AI capabilities for financial guidance

### Runtime Dependencies

**Express.js** (v5.1.0)
- HTTP server framework
- Request routing and middleware pipeline

**body-parser** (v2.2.0)
- JSON request body parsing middleware
- Handles POST request data serialization

**openai** (v6.8.0)
- Official OpenAI SDK for Node.js
- Provides typed interfaces for GPT model interactions

### Environment Configuration

**Required Environment Variables**:
- `OPENAI_API_KEY`: Authentication credential for OpenAI API access

### Future Integration Considerations

The architecture supports future additions:
- Database integration (PostgreSQL/Drizzle ORM recommended for structured data)
- Authentication providers (OAuth, JWT)
- Analytics and monitoring services
- Message queue systems for async processing