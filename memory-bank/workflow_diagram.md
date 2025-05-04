# Triangle Slideshow Workflow Diagram

This diagram illustrates the complete workflow of the triangle slideshow system, showing how images are processed, transformed into triangle representations, and transitions are created between them.

```mermaid
flowchart TD
    %% Main input and components
    images[Input Images] --> create[create_slideshow.py]
    
    %% Main processor subgraph
    subgraph triangle_slideshow
        processor[processor.py] --> slideshow[slideshow.py]
        slideshow --> transition[transition.py]
        transition --> slideshow
    end
    
    %% Flow connections
    create --> processor
    
    %% Processing steps
    processor -- "Process images\nwith triangler" --> triangles[Triangle Representations]
    triangles --> slides[Slides Collection]
    slides -- "Add to\nslideshow" --> slideshow
    
    %% Standardization
    subgraph "Triangle Standardization"
        count[Find max triangle count]
        dummy[Add dummy triangles]
        opacity[Set opacity=0]
        position[Copy positions from adjacent slides]
        
        count --> dummy --> opacity --> position
    end
    
    slideshow -- "standardize_triangle_counts()" --> count
    
    %% Transition modes
    subgraph "Transition Modes"
        sequential[Sequential\n1→2→3] 
        roundrobin[Round Robin\n1→2→3→1]
    end
    
    %% Standardization to transitions
    position --> sequential
    position --> roundrobin
    
    %% Transition creation
    slideshow -- "default" --> sequential
    slideshow -- "--round-robin" --> roundrobin
    
    %% Transition algorithms
    subgraph "Hungarian Algorithm"
        centroids[Calculate Centroids]
        costmatrix[Generate Cost Matrix]
        assignment[Linear Assignment]
        pairings[Create Pairings]
        
        centroids --> costmatrix --> assignment --> pairings
    end
    
    transition --> centroids
    
    %% Output handling
    slideshow --> json[Slideshow JSON]
    json --> output[Output File]
    
    %% Optional frontend visualization
    output -- "Load JSON" --> frontend[Frontend Visualization]
    
    %% Frontend rendering
    subgraph "Frontend (React+SVG)"
        load[Load Transitions]
        render[Render Triangles]
        animate[Animate with GSAP]
        
        load --> render --> animate
    end
    
    frontend --> load
    
    %% Styling
    classDef primary fill:#9370DB,stroke:#333,stroke-width:2px
    classDef secondary fill:#87CEFA,stroke:#333,stroke-width:1px
    classDef highlight fill:#FF7F50,stroke:#333,stroke-width:2px
    classDef standardize fill:#90EE90,stroke:#333,stroke-width:2px
    
    class create,processor,slideshow,transition primary
    class sequential secondary
    class roundrobin highlight
    class centroids,costmatrix,assignment,pairings secondary
    class render,animate secondary
    class count,dummy,opacity,position standardize
```

## Key Components

1. **Entry Point**: `create_slideshow.py` as the main CLI interface
2. **Core Package Structure**: The modular `triangle_slideshow` package with its three main components
3. **Processing Flow**: From input images to triangle representations to slides
4. **Triangle Standardization**: Ensures all slides have the same number of triangles:
   - Identifies the maximum triangle count across all slides
   - Adds invisible dummy triangles (opacity=0) to slides with fewer triangles
   - Copies position coordinates from adjacent slides for dummy triangles
   - Enables proper pairing between slides with originally different triangle counts
5. **Transition Options**: Two simple modes available:
   - **Sequential (default)**: Creates transitions between consecutive slides (1→2→3)
   - **Round-Robin**: Creates a circular pattern including transition from last to first (1→2→3→1)
6. **Hungarian Algorithm**: The key steps in matching triangles between slides
7. **Output Generation**: Creating the slideshow JSON file
8. **Frontend Integration**: Optional visualization with React and SVG

The standardization feature ensures consistent triangle counts across all slides, facilitating smooth transitions regardless of the original number of triangles in each slide. The round-robin transition feature creates circular transitions that loop back from the last slide to the first. 