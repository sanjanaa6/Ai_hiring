# Electronics Interview System with PCB Design Integration

## Overview

The Electronics Interview System is a specialized interview platform designed for electronics and electrical engineering positions. It includes a mandatory PCB (Printed Circuit Board) design round that allows candidates to demonstrate their practical skills in circuit design and PCB layout.

## Features

### 🔧 Electronics-Specific Interview Rounds

1. **Electronics Fundamentals & Theory** (20-25 minutes)
   - Basic electronics principles (Ohm's law, Kirchhoff's laws)
   - AC/DC circuits and component behavior
   - Circuit analysis and calculations

2. **Component Knowledge & Selection** (20-25 minutes)
   - Electronic components and their applications
   - Component specifications and selection criteria
   - Datasheet interpretation

3. **Circuit Design & Analysis** (20-25 minutes)
   - Amplifier circuits, filter design, power supplies
   - Digital and analog circuit design
   - Circuit simulation and analysis

4. **PCB Design & Circuit Analysis** (25-30 minutes) - **MANDATORY ROUND**
   - Interactive PCB design challenges
   - Component placement and routing
   - Signal integrity and power distribution
   - Design for manufacturability

5. **Testing & Troubleshooting** (15-20 minutes)
   - Test equipment usage and measurements
   - Fault diagnosis and troubleshooting
   - Safety procedures and standards

6. **Project Experience & Problem Solving** (15-20 minutes)
   - Past electronics projects and challenges
   - Industry standards and best practices
   - Communication with non-technical stakeholders

### 🎯 PCB Design Interface

The PCB design round includes:
- **Interactive Component Placement**: Drag and drop components onto the PCB
- **Wire Routing**: Connect components with proper routing
- **Component Library**: Access to resistors, capacitors, microcontrollers, etc.
- **Design Constraints**: Real-world manufacturing constraints
- **Evaluation Criteria**: Component placement, routing quality, manufacturability

## Technical Implementation

### Backend Components

#### 1. Electronics Interview Service (`backend/routes/electronicsInterviewService.js`)
- Generates electronics-specific interviews with AI
- Detects electronics roles (electronics_engineer, electrical_engineer, embedded_engineer, hardware_engineer)
- Includes mandatory PCB round for relevant roles
- Handles PCB design answer submissions

#### 2. Enhanced Interview Model (`backend/models/Interview.js`)
- Added `interviewType` field to distinguish electronics interviews
- Enhanced question schema with `pcbDesign` and `codeEditor` fields
- Support for PCB design evaluation criteria

#### 3. Server Integration (`backend/server.js`)
- Added electronics interview routes
- CORS configuration for PCB interface
- API endpoints for PCB design submissions

### Frontend Components

#### 1. PCB Round Interface (`frontend/src/components/PCBRoundInterface.js`)
- Interactive PCB design canvas
- Component library and placement tools
- Wire routing and connection tools
- Real-time design validation
- Timer and submission handling

#### 2. Electronics Interview Flow (`frontend/src/components/ElectronicsInterviewFlow.js`)
- Manages the complete electronics interview process
- Detects PCB rounds and switches to PCB interface
- Handles interview progression and completion
- Integrates with existing interview system

#### 3. Electronics Interview Generator (`frontend/src/pages/ElectronicsInterviewGenerator.js`)
- User interface for creating electronics interviews
- Role-specific templates and prompts
- Quick start templates for common positions
- Interview type selection

#### 4. Electronics Interview Handler (`frontend/src/components/ElectronicsInterviewHandler.js`)
- Routes electronics interviews to appropriate components
- Handles interview loading and error states
- Manages interview completion flow

#### 5. Electronics Interview Service (`frontend/src/services/electronicsInterviewService.js`)
- API integration for electronics interviews
- PCB design validation and submission
- Interview type detection and management

## Usage

### For Recruiters

1. **Access Electronics Interview Generator**
   - Navigate to `/electronics/generate`
   - Or use the "Create Electronics Interview" button in recruiter dashboard

2. **Select Interview Type**
   - Electronics Engineer (includes PCB round)
   - Electrical Engineer (no PCB round)
   - Embedded Engineer (includes PCB round)
   - Hardware Engineer (includes PCB round)

3. **Configure Interview**
   - Enter job description and requirements
   - Use quick templates or create custom prompts
   - Generate interview with AI

4. **Share Interview Link**
   - Get interview link to share with candidates
   - Monitor candidate progress and results

### For Candidates

1. **Access Interview**
   - Use interview link provided by recruiter
   - System automatically detects electronics interview type

2. **Complete Interview Rounds**
   - Answer technical questions
   - Complete hands-on challenges
   - Design PCB layouts in interactive interface

3. **PCB Design Round**
   - Place components on PCB canvas
   - Route connections between components
   - Explain design choices and considerations
   - Submit completed design

## API Endpoints

### Electronics Interview Generation
```
POST /api/electronics/generate-electronics
Content-Type: application/json
Authorization: Bearer <token>

{
  "prompt": "Job description and requirements..."
}
```

### Get Electronics Interview
```
GET /api/electronics/:interviewId
Authorization: Bearer <token>
```

### Submit PCB Design Answer
```
POST /api/electronics/:interviewId/rounds/:roundId/questions/:questionId/pcb-answer
Content-Type: application/json
Authorization: Bearer <token>

{
  "pcbDesign": {
    "components": [...],
    "wires": [...],
    "designNotes": "...",
    "timeSpent": 300
  }
}
```

## Configuration

### Environment Variables
```bash
# Required for AI interview generation
OPENROUTER_API_KEY=your_openrouter_api_key

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/ai-hiring
```

### PCB Design Components
The system includes a comprehensive component library:
- **Passive Components**: Resistors, Capacitors, Inductors
- **Active Components**: Transistors, Diodes, LEDs
- **Integrated Circuits**: Microcontrollers, Op-amps
- **Connectors**: Headers, Terminals, Sockets
- **Sensors**: Temperature, Pressure, Motion sensors

## Testing

### Run Electronics Interview Tests
```bash
cd backend
node test-electronics-interview.js
```

### Test Features
- Electronics interview generation
- PCB round detection
- Component library validation
- Design constraint testing
- Answer submission flow

## Integration with Existing System

The electronics interview system integrates seamlessly with the existing AI hiring platform:

1. **Unified Authentication**: Uses existing user authentication system
2. **Shared Database**: Stores interviews in the same MongoDB database
3. **Consistent UI**: Follows existing design patterns and themes
4. **Role-Based Access**: Respects existing user roles and permissions
5. **Analytics Integration**: Works with existing interview analytics

## Future Enhancements

### Planned Features
1. **Advanced PCB Simulation**: Real-time circuit simulation
2. **Component 3D Visualization**: 3D component models and placement
3. **Manufacturing Integration**: Direct integration with PCB manufacturers
4. **Collaborative Design**: Multi-user PCB design sessions
5. **Advanced Analytics**: Detailed PCB design performance metrics

### Technical Improvements
1. **Performance Optimization**: Canvas rendering optimization
2. **Mobile Support**: Touch-friendly PCB design interface
3. **Offline Support**: Local design saving and synchronization
4. **Version Control**: Design versioning and change tracking

## Troubleshooting

### Common Issues

1. **PCB Interface Not Loading**
   - Check browser console for JavaScript errors
   - Ensure all PCB components are properly imported
   - Verify canvas rendering support

2. **Interview Generation Fails**
   - Verify OpenRouter API key is configured
   - Check network connectivity
   - Review job description prompt quality

3. **PCB Design Submission Issues**
   - Validate PCB design data structure
   - Check component placement requirements
   - Ensure design notes are provided

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=electronics:*
```

## Support

For technical support or feature requests:
- Check the troubleshooting section above
- Review the test suite for validation
- Contact the development team for advanced issues

## License

This electronics interview system is part of the AI Hiring Platform and follows the same licensing terms.
