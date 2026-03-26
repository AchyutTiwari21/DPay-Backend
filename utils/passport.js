import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { googleOAuthRedirectUrl } from "../constants.js";
import { User } from "../models/index.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      callbackURL: googleOAuthRedirectUrl,
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
            googleId: profile.id,
            authType: "GOOGLE",
          });
        } else {
          user.googleId = profile.id;
          user.authType = "GOOGLE";
          await user.save({ validateBeforeSave: false });
        }
      
        return done(null, {
          id: user._id,
          email: user.email,
        });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
