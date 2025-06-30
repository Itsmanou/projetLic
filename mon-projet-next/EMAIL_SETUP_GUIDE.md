# 📧 Configuration Email pour le Formulaire de Contact

## Instructions pour configurer Gmail avec Nodemailer

### 1. **Préparer votre compte Gmail**

1. **Activez la validation en 2 étapes** sur votre compte Gmail :
   - Allez sur [myaccount.google.com](https://myaccount.google.com)
   - Cliquez sur "Sécurité" dans le menu de gauche
   - Activez "Validation en 2 étapes"

### 2. **Générer un mot de passe d'application**

1. Une fois la validation en 2 étapes activée :
   - Retournez dans "Sécurité"
   - Cliquez sur "Mots de passe des applications"
   - Sélectionnez "Autre (nom personnalisé)"
   - Tapez "GelHydro Contact Form" ou un nom de votre choix
   - Cliquez sur "Générer"

2. **Copiez le mot de passe généré** (format: xxxx xxxx xxxx xxxx)

### 3. **Mettre à jour le fichier .env.local**

Remplacez `your-gmail-app-password-here` dans le fichier `.env.local` par le mot de passe d'application généré :

```bash
EMAIL_USER=kamenimanuella932@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # Remplacez par votre mot de passe d'application
```

### 4. **Alternative : Utiliser un autre fournisseur email**

Si vous préférez utiliser un autre service email, voici quelques configurations populaires :

#### **Outlook/Hotmail :**
```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=votre-email@outlook.com
EMAIL_PASS=votre-mot-de-passe
```

#### **Yahoo Mail :**
```bash
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=votre-email@yahoo.com
EMAIL_PASS=votre-mot-de-passe-application
```

### 5. **Test de la configuration**

Après avoir configuré les variables d'environnement :

1. Redémarrez votre serveur de développement :
   ```bash
   npm run dev
   ```

2. Allez sur [http://localhost:3001/contact](http://localhost:3001/contact)

3. Remplissez et envoyez le formulaire de test

4. Vérifiez votre boîte email pour le message reçu

### 6. **Résolution des problèmes courants**

#### **"Error: Invalid login"**
- Vérifiez que la validation en 2 étapes est activée
- Assurez-vous d'utiliser le mot de passe d'application, pas votre mot de passe Gmail normal
- Vérifiez que l'email dans `EMAIL_USER` est correct

#### **"Error: self signed certificate"**
- Ajoutez cette ligne dans votre configuration si nécessaire :
  ```javascript
  secure: false,
  requireTLS: true,
  tls: {
    rejectUnauthorized: false
  }
  ```

### 7. **Sécurité en Production**

Quand vous déployez en production :

1. **Ne commitez jamais** le fichier `.env.local` avec vos vrais mots de passe
2. Configurez les variables d'environnement directement sur votre plateforme de déploiement
3. Utilisez des mots de passe d'application spécifiques
4. Activez les notifications de connexion suspecte sur votre compte email

### 8. **Fonctionnalités du système**

✅ **Email à l'administrateur** : Vous recevez un email formaté avec tous les détails du message
✅ **Email de confirmation automatique** : Le client reçoit une confirmation de réception
✅ **Templates HTML/Text** : Emails beaux et professionnels
✅ **Validation des données** : Vérification des champs avant envoi
✅ **Gestion d'erreurs** : Messages d'erreur clairs pour l'utilisateur
✅ **Responsive** : Emails compatibles tous appareils

---

**📞 Besoin d'aide ?**
Si vous rencontrez des problèmes, vérifiez :
1. Les variables d'environnement dans `.env.local`
2. Les logs de la console du navigateur (F12)
3. Les logs du serveur dans le terminal
