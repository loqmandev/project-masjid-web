const Support = () => {
  return (
    <section className="py-16 text-(--text-default)">
      <div className="mx-auto max-w-200 px-4">
        <h2 className="mb-8 text-center text-[2.5rem] font-bold">Support</h2>
        <p><em className="mb-8 block text-center text-[0.9rem]">Last updated: February 18, 2026</em></p>

        <h3 className="mb-4 mt-8 text-[1.8rem]">How Can We Help?</h3>
        <p className="mb-4 leading-[1.6]">
          Welcome to the Jejak Masjid Support page. We're here to help you make the most of your experience with our app. If you can't find the answer you're looking for below, please don't hesitate to contact us directly.
        </p>

        <h3 className="mb-4 mt-8 text-[1.8rem]">Contact Us</h3>
        <p className="mb-4 leading-[1.6]">
          For any questions, issues, or feedback, please reach out to us via email:
        </p>
        <p className="mb-6 leading-[1.6]">
          <a href="mailto:admin@lonasoft.com.my" className="text-primary font-semibold hover:underline">
            admin@lonasoft.com.my
          </a>
        </p>

        <h3 className="mb-4 mt-8 text-[1.8rem]">Frequently Asked Questions</h3>

        <details className="mb-3 border-b border-border pb-3">
          <summary className="cursor-pointer text-[1.2rem] font-semibold hover:text-primary">
            How do I create an account?
          </summary>
          <p className="mt-2 leading-[1.6]">
            You can create an account using three options: Google, Apple, or your email address. Simply open the app and tap "Continue with Google/Apple/Email." All authentication methods are passwordless—for email sign-up, an OTP code will be sent to your email. Follow the on-screen instructions to complete the registration process.
          </p>
        </details>

        <details className="mb-3 border-b border-border pb-3">
          <summary className="cursor-pointer text-[1.2rem] font-semibold hover:text-primary">
            How do I find masjids near me?
          </summary>
          <p className="mt-2 leading-[1.6]">
            The app uses your device's location to show you nearby masjids. Make sure you have granted location permissions to the app. Please note that you cannot search manually for masjids—the app requires your device location. Also, ensure you grant "Precise" location, not "Approximate," as this may affect your check-in experience.
          </p>
        </details>

        <details className="mb-3 border-b border-border pb-3">
          <summary className="cursor-pointer text-[1.2rem] font-semibold hover:text-primary">
            How do I track my masjid visits?
          </summary>
          <p className="mt-2 leading-[1.6]">
            When you visit a masjid, open the app and check in at that location. Your visit will be recorded in your personal visit history, which you can access from your profile. Your visit history is private and only visible to you.
          </p>
        </details>

        <details className="mb-3 border-b border-border pb-3">
          <summary className="cursor-pointer text-[1.2rem] font-semibold hover:text-primary">
            How do I update my profile?
          </summary>
          <p className="mt-2 leading-[1.6]">
            Go to your profile section within the app. From there, you can change your username, upload or change your profile picture, and manage your privacy settings. You can also choose to appear anonymously on the leaderboard.
          </p>
        </details>

        <details className="mb-3 border-b border-border pb-3">
          <summary className="cursor-pointer text-[1.2rem] font-semibold hover:text-primary">
            How do I request a new masjid to be added?
          </summary>
          <p className="mt-2 leading-[1.6]">
            If you notice a masjid that's missing from our database, you can report it directly in the app: go to <strong>Explore</strong> and tap the link "<em>Incorrect information? Report here</em>." Alternatively, send us an email at <a href="mailto:admin@lonasoft.com.my" className="text-primary hover:underline">admin@lonasoft.com.my</a> with the masjid name, address, and any other relevant details. We'll review and add it as soon as possible.
          </p>
        </details>

        <details className="mb-3 border-b border-border pb-3">
          <summary className="cursor-pointer text-[1.2rem] font-semibold hover:text-primary">
            How do I report incorrect masjid information?
          </summary>
          <p className="mt-2 leading-[1.6]">
            If you notice incorrect facility information for a masjid, tap on that specific masjid to view its details, then tap the link "<em>Incorrect information? Report here</em>." You can also email us directly at <a href="mailto:admin@lonasoft.com.my" className="text-primary hover:underline">admin@lonasoft.com.my</a> with the masjid name and the details that need to be corrected.
          </p>
        </details>

        <details className="mb-3 border-b border-border pb-3">
          <summary className="cursor-pointer text-[1.2rem] font-semibold hover:text-primary">
            I'm having trouble logging in
          </summary>
          <p className="mt-2 leading-[1.6]">
            If you're having trouble logging in, try the following:
          </p>
          <ul className="my-2 list-disc pl-5">
            <li className="mb-2 leading-[1.6]">Make sure you have a stable internet connection</li>
            <li className="mb-2 leading-[1.6]">Ensure you're using the correct authentication method (Google, Apple, or Email)</li>
            <li className="mb-2 leading-[1.6]">For email login, check your inbox (and spam/junk folder) for the OTP code</li>
            <li className="mb-2 leading-[1.6]">Try closing and reopening the app</li>
            <li className="mb-2 leading-[1.6]">If the issue persists, contact us at <a href="mailto:admin@lonasoft.com.my" className="text-primary hover:underline">admin@lonasoft.com.my</a></li>
          </ul>
        </details>

        <details className="mb-3 border-b border-border pb-3">
          <summary className="cursor-pointer text-[1.2rem] font-semibold hover:text-primary">
            How do I delete my account?
          </summary>
          <p className="mt-2 leading-[1.6]">
            You can delete your account directly in the app: go to <strong>Profile</strong>, tap the <strong>gear icon</strong> in the top right corner, and select "<strong>Delete Account</strong>" at the bottom of the menu. Alternatively, send an email request to <a href="mailto:admin@lonasoft.com.my" className="text-primary hover:underline">admin@lonasoft.com.my</a> from the email address associated with your account.
          </p>
        </details>

        <details className="mb-3 border-b border-border pb-3">
          <summary className="cursor-pointer text-[1.2rem] font-semibold hover:text-primary">
            How does the leaderboard work?
          </summary>
          <p className="mt-2 leading-[1.6]">
            The leaderboard displays users based on their masjid visit count. It shows your username and profile picture. If you prefer privacy, you can choose to appear anonymously on the leaderboard. Your visit history is never shared with other users.
          </p>
        </details>

        <details className="mb-3 border-b border-border pb-3">
          <summary className="cursor-pointer text-[1.2rem] font-semibold hover:text-primary">
            Is my location data stored?
          </summary>
          <p className="mt-2 leading-[1.6]">
            No, we do not store your location data on our servers. Your location is only used temporarily to help you find nearby masjids. Location data may be cached locally on your device for performance purposes, but it is never transmitted to or stored on our databases.
          </p>
        </details>

        <h3 className="mb-4 mt-8 text-[1.8rem]">Still Need Help?</h3>
        <p className="mb-4 leading-[1.6]">
          If you couldn't find the answer to your question, please contact us directly at <a href="mailto:admin@lonasoft.com.my" className="text-primary font-semibold hover:underline">admin@lonasoft.com.my</a>. We typically respond within 24-48 hours.
        </p>
      </div>
    </section>
  );
};

export default Support;
