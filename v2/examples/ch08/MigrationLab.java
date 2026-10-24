import java.util.*;
public final class MigrationLab {
  record Change(long token,String id,String value,boolean delete){}
  static final class Migrator {
    final Map<String,String> target=new TreeMap<>(); long checkpoint; boolean sourceWritable=true,destinationWritable=false;
    void baseline(Map<String,String> source){target.putAll(source);}
    void apply(Change c){
      if(c.token()<=checkpoint)return;
      if(c.token()!=checkpoint+1)throw new IllegalStateException("change-stream gap");
      if(c.delete())target.remove(c.id());else target.put(c.id(),c.value());
      checkpoint=c.token();
    }
    void cutover(){sourceWritable=false;destinationWritable=true;}
    void sourceWrite(String id,String value){if(!sourceWritable)throw new IllegalStateException("source fenced");}
    String checksum(){return Integer.toHexString(target.entrySet().toString().hashCode());}
  }
  static void require(boolean ok,String message){if(!ok)throw new AssertionError(message);}
  public static void main(String[] args){
    var source=new TreeMap<String,String>();source.put("a","10");source.put("b","20");
    var m=new Migrator();m.baseline(source);
    m.apply(new Change(1,"b","21",false));m.apply(new Change(1,"b","21",false));
    m.apply(new Change(2,"a","",true));m.apply(new Change(3,"c","30",false));
    require(m.checkpoint==3,"checkpoint");require(m.target.equals(Map.of("b","21","c","30")),"convergence");
    boolean gap=false;try{m.apply(new Change(5,"d","40",false));}catch(IllegalStateException e){gap=true;}require(gap,"gap detected");
    m.cutover();boolean fenced=false;try{m.sourceWrite("x","1");}catch(IllegalStateException e){fenced=true;}require(fenced&&m.destinationWritable,"single writer");
    require(m.checksum().equals(Integer.toHexString(m.target.entrySet().toString().hashCode())),"deterministic checksum");
    System.out.println("PASS: duplicate replay, gap detection, convergence, fencing and checksum");
  }
}
