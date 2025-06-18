class RoomSummaryTask {
  private timmer: NodeJS.Timeout | undefined;

  mount() {
    this.timmer = setInterval(() => {
      console.log('room summary task');
    }, 1000);
  }

  unmount() {
    clearInterval(this.timmer);
  }
}

export default RoomSummaryTask;
