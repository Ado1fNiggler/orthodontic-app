# 🦷 Orthodontic Practice Management System

Ολοκληρωμένο σύστημα διαχείρισης ορθοδοντικού ιατρείου που συνεργάζεται με το υπάρχον booking system.

## 🏗️ Αρχιτεκτονική

- **Frontend**: React PWA (Progressive Web App) - Hostinger (app.liougiourou.gr)
- **Backend**: Node.js API - Render.com (δωρεάν tier)
- **Database**: Supabase PostgreSQL (δωρεάν 500MB)
- **Storage**: Cloudinary (φωτογραφίες 25GB), Hostinger (έγγραφα)
- **Integration**: MySQL booking system (liougiourou.gr)

## ✨ Λειτουργίες

### 📁 Διαχείριση Ασθενών
- Πλήρης καρτέλα ασθενή με flexible fields
- Αναζήτηση & φιλτράρισμα
- Import από το existing booking system
- Export σε Excel/PDF

### 📸 Σύστημα Φωτογραφιών
- Upload από κινητό με 1 click
- Κατηγορίες (πριν/μετά, ενδοστοματικές, ακτινογραφίες)
- Timeline προόδου
- Σύγκριση before/after

### 🦷 Ορθοδοντικά Εργαλεία
- Διάγραμμα δοντιών (tooth chart)
- Καταγραφή brackets & wires
- Φάσεις θεραπείας
- Clinical notes με templates

### 📅 Ενσωμάτωση Ραντεβού
- Sync με το υπάρχον booking system
- Προβολή ραντεβού ανά ασθενή
- Ιστορικό επισκέψεων

### 💰 Οικονομική Παρακολούθηση
- Καταγραφή πληρωμών
- Payment plans / Δόσεις
- Εκτύπωση αποδείξεων
- Στατιστικά εσόδων

### 📊 Reports & Analytics
- Dashboard με στατιστικά
- Μηνιαία reports
- Export δεδομένων

## 🚀 Γρήγορη Εκκίνηση

### Προαπαιτούμενα
- Node.js (>= 18.0.0)
- npm (>= 9.0.0)
- Docker & Docker Compose (για local database)
- Git

### Εγκατάσταση

1. **Clone το repository**
   ```bash
   git clone https://github.com/yourusername/orthodontic-app.git
   cd orthodontic-app
   ```

2. **Εγκατάσταση dependencies**
   ```bash
   npm run install:all
   ```

3. **Δημιουργία environment files**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

4. **Ρύθμιση environment variables**
   - Επεξεργασία των `.env` αρχείων με τα σωστά credentials
   - Βλέπε παρακάτω για λεπτομέρειες

5. **Εκκίνηση της βάσης δεδομένων**
   ```bash
   npm run docker:up
   ```

6. **Ρύθμιση βάσης δεδομένων**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

7. **Εκκίνηση development servers**
   ```bash
   npm run dev
   ```

   Αυτό θα ξεκινήσει:
   - Backend API: http://localhost:5000
   - Frontend App: http://localhost:5173
   - Database Admin: http://localhost:8080

## 🔧 Environment Configuration

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://orthodontic_user:orthodontic_password@localhost:5432/orthodontic_app
JWT_SECRET=your-super-secret-jwt-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
SMTP_HOST=smtp.hostinger.com
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Orthodontic App
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

## 📱 PWA Features

Η εφαρμογή είναι Progressive Web App με:
- **Offline functionality** - Λειτουργεί χωρίς internet
- **Mobile installation** - Εγκατάσταση στο κινητό
- **Push notifications** - Ειδοποιήσεις για ραντεβού
- **Camera integration** - Λήψη φωτογραφιών
- **Responsive design** - Προσαρμογή σε όλες τις συσκευές

## 🗄️ Database Schema

### Κύριοι πίνακες:
- **patients** - Στοιχεία ασθενών
- **photos** - Φωτογραφίες με categories & metadata
- **treatments** - Σχέδια θεραπείας & φάσεις
- **appointments** - Sync με booking system
- **payments** - Οικονομική παρακολούθηση
- **clinical_notes** - Κλινικές σημειώσεις

## 🌐 Deployment

### Frontend (Hostinger)
```bash
npm run build:frontend
# Upload dist/ folder to app.liougiourou.gr
```

### Backend (Render.com)
```bash
git push origin main
# Auto-deploy μέσω Render GitHub integration
```

### Database (Supabase)
- Automatic backups
- Real-time subscriptions
- Row Level Security (RLS)

## 🔗 Integration με Booking System

Το σύστημα συνδέεται με το υπάρχον MySQL booking system:
- **Real-time sync** ραντεβού
- **Patient import** από booking DB
- **Unified dashboard** με όλα τα δεδομένα

## 📊 Monitoring & Analytics

- **Error tracking** με custom logger
- **Performance monitoring** 
- **Usage analytics** για optimization
- **Automated backups** & health checks

## 🛡️ Security Features

- **JWT Authentication** με refresh tokens
- **Role-based access control** (RBAC)
- **Data encryption** at rest & in transit
- **HIPAA compliance** considerations
- **Rate limiting** & DDoS protection

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# E2E tests
npm run test:e2e
```

## 📝 API Documentation

Swagger UI διαθέσιμο στο: http://localhost:5000/api-docs

### Main Endpoints:
- `GET /api/patients` - Λίστα ασθενών
- `POST /api/photos/upload` - Upload φωτογραφίας
- `GET /api/treatments/:id` - Σχέδιο θεραπείας
- `POST /api/payments` - Καταγραφή πληρωμής

## 🤝 Contributing

1. Fork το repository
2. Δημιούργησε feature branch (`git checkout -b feature/amazing-feature`)
3. Commit τις αλλαγές (`git commit -m 'Add amazing feature'`)
4. Push στο branch (`git push origin feature/amazing-feature`)
5. Άνοιξε Pull Request

## 📞 Support

- **Email**: support@liougiourou.gr
- **Issues**: GitHub Issues
- **Documentation**: /docs folder

## 📄 License

Αυτό το project είναι private και ανήκει στο Dr. Liougiourou Orthodontic Clinic.

---

**Δημιουργήθηκε με ❤️ για σύγχρονη ορθοδοντική πρακτική**