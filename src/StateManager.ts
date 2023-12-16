class StateManager {
  private static instance: StateManager;
  private profile: string;
  private userSecret: string;

  private constructor() {
    this.profile = "";
    this.userSecret = "";
  }

  public static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  public setProfile(profile: string): void {
    this.profile = profile;
  }

  public getProfile(): string {
    return this.profile;
  }

  public setUserSecret(userSecret: string): void {
    this.userSecret = userSecret;
  }

  public getUserSecret(): string {
    return this.userSecret;
  }
}

export default StateManager;
