const Support = () => {
  return (
    <>

        <h2>Contact Us</h2>
        <p>
          For any questions, issues, or feedback, please reach out to us via email:
        </p>
        <p>
          <a href="mailto:admin@jejakmasjid.my" >
            admin@jejakmasjid.my
          </a>
        </p>

        <h2>Frequently Asked Questions</h2>

        <details className="group border-b border-border py-4 last:border-0">
          <summary className="cursor-pointer list-none text-lg font-medium text-foreground marker:content-none group-open:text-primary">
            How do I create an account?
          </summary>
          <p>
            You can create an account using three options: Google, Apple, or your email address. Simply open the app and tap "Continue with Google/Apple/Email." All authentication methods are passwordless. For email sign-up, an OTP code will be sent to your email. Follow the on-screen instructions to complete the registration process.
          </p>
        </details>

        <details className="group border-b border-border py-4 last:border-0">
          <summary className="cursor-pointer list-none text-lg font-medium text-foreground marker:content-none group-open:text-primary">
            How do I find masjids near me?
          </summary>
          <p>
            The app uses your device's location to show you nearby masjids. Make sure you have granted location permissions to the app. Please note that you cannot search manually for masjids: the app requires your device location. Also, ensure you grant "Precise" location, not "Approximate," as this may affect your check-in experience.
          </p>
        </details>

        <details className="group border-b border-border py-4 last:border-0">
          <summary className="cursor-pointer list-none text-lg font-medium text-foreground marker:content-none group-open:text-primary">
            How do I track my masjid visits?
          </summary>
          <p>
            When you visit a masjid, open the app and check in at that location. Your visit will be recorded in your personal visit history, which you can access from your profile. Your visit history is private and only visible to you.
          </p>
        </details>

        <details className="group border-b border-border py-4 last:border-0">
          <summary className="cursor-pointer list-none text-lg font-medium text-foreground marker:content-none group-open:text-primary">
            How do I update my profile?
          </summary>
          <p>
            Go to your profile section within the app. From there, you can change your username, upload or change your profile picture, and manage your privacy settings. You can also choose to appear anonymously on the leaderboard.
          </p>
        </details>

        <details className="group border-b border-border py-4 last:border-0">
          <summary className="cursor-pointer list-none text-lg font-medium text-foreground marker:content-none group-open:text-primary">
            How do I request a new masjid to be added?
          </summary>
          <p>
            If you notice a masjid that's missing from our database, you can report it directly in the app: go to <strong>Explore</strong> and tap the link "<em>Incorrect information? Report here</em>." Alternatively, send us an email at <a href="mailto:admin@jejakmasjid.my" >admin@jejakmasjid.my</a> with the masjid name, address, and any other relevant details. We'll review and add it as soon as possible.
          </p>
        </details>

        <details className="group border-b border-border py-4 last:border-0">
          <summary className="cursor-pointer list-none text-lg font-medium text-foreground marker:content-none group-open:text-primary">
            How do I report incorrect masjid information?
          </summary>
          <p>
            If you notice incorrect facility information for a masjid, tap on that specific masjid to view its details, then tap the link "<em>Incorrect information? Report here</em>." You can also email us directly at <a href="mailto:admin@jejakmasjid.my" >admin@jejakmasjid.my</a> with the masjid name and the details that need to be corrected.
          </p>
        </details>

        <details className="group border-b border-border py-4 last:border-0">
          <summary className="cursor-pointer list-none text-lg font-medium text-foreground marker:content-none group-open:text-primary">
            I'm having trouble logging in
          </summary>
          <p>
            If you're having trouble logging in, try the following:
          </p>
          <ul>
            <li>Make sure you have a stable internet connection</li>
            <li>Ensure you're using the correct authentication method (Google, Apple, or Email)</li>
            <li>For email login, check your inbox (and spam/junk folder) for the OTP code</li>
            <li>Try closing and reopening the app</li>
            <li>If the issue persists, contact us at <a href="mailto:admin@jejakmasjid.my" >admin@jejakmasjid.my</a></li>
          </ul>
        </details>

        <details className="group border-b border-border py-4 last:border-0">
          <summary className="cursor-pointer list-none text-lg font-medium text-foreground marker:content-none group-open:text-primary">
            How do I delete my account?
          </summary>
          <p>
            You can delete your account directly in the app: go to <strong>Profile</strong>, tap the <strong>gear icon</strong> in the top right corner, and select "<strong>Delete Account</strong>" at the bottom of the menu. Alternatively, send an email request to <a href="mailto:admin@jejakmasjid.my" >admin@jejakmasjid.my</a> from the email address associated with your account.
          </p>
        </details>

        <details className="group border-b border-border py-4 last:border-0">
          <summary className="cursor-pointer list-none text-lg font-medium text-foreground marker:content-none group-open:text-primary">
            How does the leaderboard work?
          </summary>
          <p>
            The leaderboard displays users based on their masjid visit count. It shows your username and profile picture. If you prefer privacy, you can choose to appear anonymously on the leaderboard. Your visit history is never shared with other users.
          </p>
        </details>

        <details className="group border-b border-border py-4 last:border-0">
          <summary className="cursor-pointer list-none text-lg font-medium text-foreground marker:content-none group-open:text-primary">
            Is my location data stored?
          </summary>
          <p>
            Yes, for your check-ins. When you check in and complete a visit, we store the coordinates of both, along with the accuracy your device reported, your IP address and your device user agent, attached to that visit. This is how a visit is verified rather than simply claimed, and how we detect falsified GPS. We do not track your location in the background, we do not collect it outside a check-in, and we never sell or share it. Deleting your account removes your visit history and the location data attached to it.
          </p>
        </details>

        <h2>Still Need Help?</h2>
        <p>
          If you couldn't find the answer to your question, please contact us directly at <a href="mailto:admin@jejakmasjid.my" >admin@jejakmasjid.my</a>. We typically respond within 24-48 hours.
        </p>
    </>
  );
};

export default Support;
